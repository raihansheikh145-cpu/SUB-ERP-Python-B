import uuid
import json
from datetime import date
from prisma import Prisma
from app.schemas.bill import BillCreate
from app.core.sequence import get_next_sequence_number
from app.services.invoice_service import InvoiceService # Reuse calculation logic

class BillService:
    @staticmethod
    async def save_bill(prisma: Prisma, payload: BillCreate):
        """
        Saves the bill and its lines transactionally.
        """
        # Calculate totals using the same logic as invoices
        totals = InvoiceService.calculate_totals(payload.items)
        
        bill_id = payload.id or f"BILL-GEN-{uuid.uuid4()}"
        vendor_id = payload.vendor_id or payload.contact_id
        
        # Determine sequence number
        b_number = payload.bill_number
        if not b_number or str(b_number).startswith("DRAFT-") or b_number == 'NEW':
            if payload.status not in ('DRAFT', 'VOID', 'DELETED'):
                b_number = await get_next_sequence_number("BILL", payload.company_id, "BILL")
            else:
                b_number = f"DRAFT-{bill_id.split('-')[-1][:8]}"
        
        jsonb_items = []
        for idx, it in enumerate(totals["items"]):
            item_dict = it.dict(by_alias=True)
            item_dict["id"] = item_dict.get("id") or str(uuid.uuid4())
            jsonb_items.append(item_dict)
            
        bill_date = payload.bill_date or payload.date or date.today()
        
        p_date = payload.date.isoformat() if hasattr(payload.date, 'isoformat') else payload.date
        d_date = payload.due_date.isoformat() if hasattr(payload.due_date, 'isoformat') else payload.due_date
        b_date = bill_date.isoformat() if hasattr(bill_date, 'isoformat') else bill_date
        

        data_jsonb = json.dumps({
            "items": jsonb_items,
            "messages": payload.messages,
            "subtotal": totals["subtotal"],
            "taxTotal": totals["tax_total"],
            "discountTotal": totals["discount_total"],
            "total": totals["total"],
            "status": payload.status,
            "companyId": payload.company_id,
            "date": payload.date.isoformat() if payload.date else None,
            "billDate": bill_date.isoformat() if bill_date else None,
            "billNumber": b_number
        }, default=str)

        async with prisma.tx() as tx:
            # 1. UPSERT Bill Header
            await tx.execute_raw(
                """
                INSERT INTO docs_bills (
                    id, bill_number, company_id, date, bill_date, due_date, vendor_id, 
                    status, subtotal, tax_total, discount_total, total, reference, created_by_id, 
                    updated_at
                ) VALUES ($1, $2, $3, $4::date, $5::date, $6::date, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    bill_number = EXCLUDED.bill_number,
                    company_id = EXCLUDED.company_id,
                    date = EXCLUDED.date,
                    bill_date = EXCLUDED.bill_date,
                    due_date = EXCLUDED.due_date,
                    vendor_id = EXCLUDED.vendor_id,
                    status = EXCLUDED.status,
                    subtotal = EXCLUDED.subtotal,
                    tax_total = EXCLUDED.tax_total,
                    discount_total = EXCLUDED.discount_total,
                    total = EXCLUDED.total,
                    reference = EXCLUDED.reference,
                    created_by_id = EXCLUDED.created_by_id,
                    updated_at = NOW()
                """,
                bill_id, b_number, payload.company_id, p_date, b_date, d_date,
                vendor_id, payload.status, totals["subtotal"], totals["tax_total"], totals["discount_total"], totals["total"],
                payload.reference, payload.created_by_id
            )

            # 2. Sync Lines (Delete missing, UPSERT existing/new)
            valid_line_ids = [it["id"] for it in jsonb_items if it.get("id")]
            if valid_line_ids:
                await tx.execute_raw(
                    "DELETE FROM docs_bill_lines WHERE bill_id = $1 AND id != ALL($2)",
                    bill_id, valid_line_ids
                )
            else:
                await tx.execute_raw("DELETE FROM docs_bill_lines WHERE bill_id = $1", bill_id)

            for idx, item in enumerate(jsonb_items):
                line_id = item["id"]
                serial_nums = json.dumps(item.get("serialNumbers", []))
                
                await tx.execute_raw(
                    """
                    INSERT INTO docs_bill_lines (
                        id, bill_id, company_id, product_id, quantity, unit_price, discount, 
                        tax, total, description, line_value, discount_rate, discount_mode, 
                        type, serial_numbers, display_index, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, NOW())
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
                        serial_numbers = EXCLUDED.serial_numbers,
                        display_index = EXCLUDED.display_index,
                        updated_at = NOW()
                    """,
                    line_id, bill_id, payload.company_id, item.get("productId"), float(item.get("quantity") or 0),
                    float(item.get("unitPrice") or 0), float(item.get("discountAmount") or 0), float(item.get("taxValue") or 0),
                    float(item.get("total") or 0), item.get("description"), float(item.get("lineValue") or 0),
                    float(item.get("discountRate") or 0), item.get("discountMode", "PERCENT"), item.get("type", "PRODUCT"),
                    serial_nums, idx
                )
                
        return bill_id
