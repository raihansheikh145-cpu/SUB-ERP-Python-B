import json
import uuid
from datetime import date
from typing import Any, Dict
from prisma import Prisma
from app.services.accounting_service import AccountingService
from app.core.sequence import get_next_sequence_number

class CreditNoteService:
    @staticmethod
    async def save_credit_note(prisma: Prisma, payload: Dict[str, Any]) -> str:
        """
        Replaces the SQL `process_credit_note` RPC.
        Validates, calculates, saves the credit note, and posts it via AccountingService.
        """
        cn_id = payload.get("id") or str(uuid.uuid4())
        company_id = payload.get("companyId") or payload.get("company_id")
        status = payload.get("status") or "DRAFT"
        date_val = payload.get("date") or payload.get("creditNoteDate") or str(date.today())
        if isinstance(date_val, date): date_val = date_val.isoformat()
        
        customer_id = payload.get("customerId") or payload.get("customer_id")
        invoice_id = payload.get("invoiceId") or payload.get("origin_invoice_id") or payload.get("originInvoiceId")
        number = payload.get("number")
        
        # Calculate Math
        items = payload.get("items", [])
        new_items = []
        inv_subtotal = 0.0
        inv_discount = 0.0
        inv_tax = 0.0
        inv_total = 0.0
        
        for item in items:
            calc_qty = float(item.get("quantity") or 0)
            calc_price = float(item.get("unitPrice") or item.get("unit_price") or 0)
            calc_gross = calc_qty * calc_price
            
            calc_disc_rate = float(item.get("discountRate") or 0)
            calc_disc_mode = item.get("discountMode") or "PERCENT"
            
            if calc_disc_mode == 'FIXED':
                calc_disc_amt = calc_disc_rate
            else:
                calc_disc_amt = round((calc_gross * (calc_disc_rate / 100.0)), 2)
                
            calc_tax_amt = float(item.get("taxValue") or item.get("taxAmount") or 0)
            calc_line_total = round((calc_gross - calc_disc_amt + calc_tax_amt), 2)
            
            inv_subtotal += calc_gross
            inv_discount += calc_disc_amt
            inv_tax += calc_tax_amt
            inv_total += calc_line_total
            
            item["discountAmount"] = calc_disc_amt
            item["taxAmount"] = calc_tax_amt
            item["total"] = calc_line_total
            item["lineValue"] = calc_line_total
            new_items.append(item)
            
        payload["items"] = new_items
        payload["subtotal"] = inv_subtotal
        payload["discountTotal"] = inv_discount
        payload["taxTotal"] = inv_tax
        payload["total"] = inv_total
        payload["status"] = status
        
        async with prisma.tx() as tx:
            # Check existing number
            existing = await tx.query_raw("SELECT credit_note_number FROM docs_credit_notes WHERE id = $1 LIMIT 1", cn_id)
            if existing:
                existing_number = existing[0].get("credit_note_number")
                if existing_number and not str(existing_number).startswith("DRAFT-") and existing_number != 'NEW':
                    number = existing_number
                    
            if not number or str(number).startswith("DRAFT-") or number == 'NEW':
                if status not in ('DRAFT', 'VOID', 'DELETED'):
                    number = await get_next_sequence_number("CREDIT_NOTE", company_id, "CN", tx)
                else:
                    number = f"DRAFT-{cn_id[:8]}"
            
            payload["number"] = number
            
            # Upsert Header
            await tx.execute_raw("""
                INSERT INTO docs_credit_notes (
                    id, company_id, cn_number, credit_note_number, date, credit_note_date, customer_id, origin_invoice_id, status, subtotal, discount_total, tax_total, total, created_by_id, updated_at
                ) VALUES (
                    $1, $2, $3, $3, $4::date, $4::date, $5, $6, $11, $7, $8, $9, $10, $12, NOW()
                )
                ON CONFLICT (id) DO UPDATE SET 
                    cn_number = EXCLUDED.cn_number,
                    credit_note_number = EXCLUDED.credit_note_number,
                    date = EXCLUDED.date,
                    credit_note_date = EXCLUDED.credit_note_date,
                    customer_id = EXCLUDED.customer_id,
                    origin_invoice_id = EXCLUDED.origin_invoice_id,
                    status = EXCLUDED.status,
                    total = EXCLUDED.total, 
                    subtotal = EXCLUDED.subtotal,
                    discount_total = EXCLUDED.discount_total,
                    tax_total = EXCLUDED.tax_total,
                    created_by_id = EXCLUDED.created_by_id,
                    updated_at = NOW()
            """, cn_id, company_id, number, date_val, customer_id, invoice_id, inv_subtotal, inv_discount, inv_tax, inv_total, status, payload.get("createdById") or payload.get("created_by_id"))
            
            # Upsert Lines
            await tx.execute_raw("DELETE FROM docs_credit_note_lines WHERE credit_note_id = $1", cn_id)
            
            for item in new_items:
                line_id = item.get("id") or str(uuid.uuid4())
                await tx.execute_raw("""
                    INSERT INTO docs_credit_note_lines (
                        id, credit_note_id, company_id, product_id, quantity, unit_price, 
                        discount_mode, discount_rate, line_value, total, type, description, uom, display_description
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                    )
                """, line_id, cn_id, company_id, item.get("productId"), float(item.get("quantity") or 0), float(item.get("unitPrice") or 0),
                     item.get("discountMode"), float(item.get("discountRate") or 0), float(item.get("lineValue") or 0), float(item.get("total") or 0),
                     item.get("type", "PRODUCT"), item.get("description"), item.get("uom"), item.get("displayDescription"))
            
            # Process posting
            if status == 'POSTED':
                await tx.execute_raw("UPDATE docs_credit_notes SET status = 'POSTED' WHERE id = $1", cn_id)
                await AccountingService.post_credit_note(tx, cn_id, company_id)
                
            return cn_id
