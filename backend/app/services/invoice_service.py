import uuid
import json
from datetime import date
from prisma import Prisma
from app.schemas.invoice import InvoiceCreate
from app.core.sequence import get_next_sequence_number

class InvoiceService:
    @staticmethod
    def calculate_totals(items):
        """
        Calculates subtotal, discount, tax, and total from items.
        Replicates the logic previously inside `calc_doc_totals` DB trigger.
        """
        gross_subtotal = 0.0
        line_discount_total = 0.0
        global_discount_total = 0.0
        tax_total = 0.0
        running_subtotal = 0.0
        
        has_subtotal_item = False
        last_subtotal_value = 0.0
        
        processed_items = []
        
        for item in items:
            item_type = item.type
            
            calc_disc_amt = 0.0
            calc_tax_rate = 0.0
            calc_line_value = 0.0
            
            if item_type in ("PRODUCT", "SERVICE", "CHARGE"):
                calc_gross = item.quantity * item.unit_price
                
                if item.discount_mode == "FIXED":
                    calc_disc_amt = item.discount_rate
                else: # PERCENT
                    calc_disc_amt = round(calc_gross * (item.discount_rate / 100.0), 2)
                    
                calc_tax_rate = item.tax_value or 0.0 # From frontend inline tax
                
                calc_line_value = round(calc_gross - calc_disc_amt + calc_tax_rate, 2)
                
                gross_subtotal = round(gross_subtotal + calc_gross, 2)
                line_discount_total = round(line_discount_total + calc_disc_amt, 2)
                running_subtotal = round(running_subtotal + calc_line_value, 2)
                tax_total = round(tax_total + calc_tax_rate, 2)
                
            elif item_type == "DISCOUNT":
                if item.discount_mode == "PERCENT":
                    calc_line_value = -round(running_subtotal * (item.discount_rate / 100.0), 2)
                else:
                    calc_line_value = -round(item.discount_rate, 2)
                    
                global_discount_total = round(global_discount_total + abs(calc_line_value), 2)
                running_subtotal = round(running_subtotal + calc_line_value, 2)
                
            elif item_type == "TAX":
                # Assuming taxRate is sent in tax_rate
                if item.tax_rate:
                    calc_line_value = round(running_subtotal * (item.tax_rate / 100.0), 2)
                else:
                    # manual tax value
                    calc_line_value = round(item.line_value, 2)
                    
                tax_total = round(tax_total + calc_line_value, 2)
                running_subtotal = round(running_subtotal + calc_line_value, 2)
                
            elif item_type == "SUBTOTAL":
                if item.line_value:
                    calc_line_value = round(item.line_value, 2)
                else:
                    calc_line_value = round(running_subtotal, 2)
                    
                running_subtotal = round(calc_line_value, 2)
                last_subtotal_value = round(calc_line_value, 2)
                has_subtotal_item = True
            
            # Update item with calculated values
            item.discount_amount = calc_disc_amt
            item.discount = calc_disc_amt
            item.tax_value = calc_tax_rate
            item.tax = calc_tax_rate
            item.line_value = calc_line_value
            item.total = calc_line_value
            
            processed_items.append(item)
            
        total = round(running_subtotal, 2)
        if has_subtotal_item:
            net_subtotal = last_subtotal_value
        else:
            net_subtotal = round(gross_subtotal, 2)
            
        final_discount_total = line_discount_total + global_discount_total
        
        return {
            "subtotal": net_subtotal,
            "discount_total": final_discount_total,
            "tax_total": tax_total,
            "total": total,
            "items": processed_items
        }

    @staticmethod
    async def save_invoice(prisma: Prisma, payload: InvoiceCreate):
        """
        Saves the invoice and its lines transactionally.
        """
        # Calculate totals
        totals = InvoiceService.calculate_totals(payload.items)
        
        invoice_id = payload.id or f"INV-GEN-{uuid.uuid4()}"
        cust_id = payload.customer_id or payload.contact_id
        
        # Determine sequence number
        inv_number = payload.invoice_number
        if not inv_number or str(inv_number).startswith("DRAFT-") or inv_number == 'NEW':
            if payload.status not in ('DRAFT', 'VOID', 'DELETED'):
                inv_number = await get_next_sequence_number("INVOICE", payload.company_id, "INV")
            else:
                inv_number = f"DRAFT-{invoice_id.split('-')[-1][:8]}"
        
        # We need to extract the raw items as dicts to save in data JSONB for backward compatibility for now
        # until frontend is fully adapted
        jsonb_items = []
        for idx, it in enumerate(totals["items"]):
            item_dict = it.dict(by_alias=True)
            item_dict["id"] = item_dict.get("id") or str(uuid.uuid4())
            jsonb_items.append(item_dict)
            
        inv_date = payload.invoice_date or payload.date or date.today()
        
        p_date = payload.date.isoformat() if hasattr(payload.date, 'isoformat') else payload.date
        d_date = payload.due_date.isoformat() if hasattr(payload.due_date, 'isoformat') else payload.due_date
        i_date = inv_date.isoformat() if hasattr(inv_date, 'isoformat') else inv_date
        
        data_jsonb = json.dumps({
            "id": invoice_id,
            "items": jsonb_items,
            "messages": payload.messages,
            "subtotal": totals["subtotal"],
            "taxTotal": totals["tax_total"],
            "discountTotal": totals["discount_total"],
            "total": totals["total"],
            "status": payload.status,
            "companyId": payload.company_id,
            "customerId": cust_id,
            "clientId": cust_id,
            "contactId": cust_id,
            "date": payload.date.isoformat() if payload.date else None,
            "invoiceDate": inv_date.isoformat() if inv_date else None,
            "invoiceNumber": inv_number,
            "reference": payload.reference,
            "salesperson": payload.salesperson,
            "customerNote": payload.customer_note,
            "deliveryPerson": payload.delivery_person,
            "dueDate": payload.due_date.isoformat() if payload.due_date else None,
            "createdById": payload.created_by_id
        }, default=str)

        async with prisma.tx() as tx:
            # 1. UPSERT Invoice Header
            await tx.execute_raw(
                """
                INSERT INTO docs_invoices (
                    id, invoice_number, company_id, date, invoice_date, due_date, customer_id, 
                    status, subtotal, tax_total, discount_total, total, reference, salesperson, 
                    customer_note, delivery_person, created_by_id, data, updated_at
                ) VALUES ($1, $2, $3, $4::date, $5::date, $6::date, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    invoice_number = EXCLUDED.invoice_number,
                    company_id = EXCLUDED.company_id,
                    date = EXCLUDED.date,
                    invoice_date = EXCLUDED.invoice_date,
                    due_date = EXCLUDED.due_date,
                    customer_id = EXCLUDED.customer_id,
                    status = EXCLUDED.status,
                    subtotal = EXCLUDED.subtotal,
                    tax_total = EXCLUDED.tax_total,
                    discount_total = EXCLUDED.discount_total,
                    total = EXCLUDED.total,
                    reference = EXCLUDED.reference,
                    salesperson = EXCLUDED.salesperson,
                    customer_note = EXCLUDED.customer_note,
                    delivery_person = EXCLUDED.delivery_person,
                    created_by_id = EXCLUDED.created_by_id,
                    data = EXCLUDED.data,
                    updated_at = NOW()
                """,
                invoice_id, inv_number, payload.company_id, p_date, i_date, d_date,
                cust_id, payload.status, totals["subtotal"], totals["tax_total"], totals["discount_total"], totals["total"],
                payload.reference, payload.salesperson, payload.customer_note, payload.delivery_person, payload.created_by_id,
                data_jsonb
            )

            # 2. Sync Lines (Delete missing, UPSERT existing/new)
            valid_line_ids = [it["id"] for it in jsonb_items if it.get("id")]
            if valid_line_ids:
                # Delete lines not in the current payload
                await tx.execute_raw(
                    "DELETE FROM docs_invoice_lines WHERE invoice_id = $1 AND id != ALL($2)",
                    invoice_id, valid_line_ids
                )
            else:
                await tx.execute_raw("DELETE FROM docs_invoice_lines WHERE invoice_id = $1", invoice_id)

            for idx, item in enumerate(jsonb_items):
                line_id = item["id"]
                serial_nums = json.dumps(item.get("serialNumbers", []))
                
                await tx.execute_raw(
                    """
                    INSERT INTO docs_invoice_lines (
                        id, invoice_id, company_id, product_id, quantity, unit_price, discount, 
                        tax, total, description, line_value, discount_rate, discount_mode, 
                        type, uom, display_description, serial_numbers, display_index, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        product_id = EXCLUDED.product_id,
                        quantity = EXCLUDED.quantity,
                        unit_price = EXCLUDED.unit_price,
                        discount = EXCLUDED.discount,
                        tax = EXCLUDED.tax,
                        total = EXCLUDED.total,
                        description = EXCLUDED.description,
                        line_value = EXCLUDED.line_value,
                        discount_rate = EXCLUDED.discount_rate,
                        discount_mode = EXCLUDED.discount_mode,
                        type = EXCLUDED.type,
                        uom = EXCLUDED.uom,
                        display_description = EXCLUDED.display_description,
                        serial_numbers = EXCLUDED.serial_numbers,
                        display_index = EXCLUDED.display_index,
                        updated_at = NOW()
                    """,
                    line_id, invoice_id, payload.company_id, item.get("productId"), float(item.get("quantity") or 0),
                    float(item.get("unitPrice") or 0), float(item.get("discountAmount") or 0), float(item.get("taxValue") or 0),
                    float(item.get("total") or 0), item.get("description"), float(item.get("lineValue") or 0),
                    float(item.get("discountRate") or 0), item.get("discountMode", "PERCENT"), item.get("type", "PRODUCT"),
                    item.get("uom"), item.get("displayDescription"), serial_nums, idx
                )
                
        return invoice_id
