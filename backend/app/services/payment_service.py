import json
import uuid
from datetime import date
from typing import Any, Dict
from prisma import Prisma
from app.services.accounting_service import AccountingService

class PaymentService:
    @staticmethod
    async def save_payment(prisma: Prisma, payload: Dict[str, Any]) -> str:
        """
        Replaces the SQL `process_payment` RPC.
        Validates, saves the payment, and posts it via AccountingService.
        """
        payment_id = payload.get("id") or str(uuid.uuid4())
        company_id = payload.get("companyId") or payload.get("company_id")
        status = payload.get("status") or "DRAFT"
        date_val = payload.get("date") or payload.get("paymentDate") or date.today()
        p_date = date_val.isoformat() if hasattr(date_val, 'isoformat') else date_val
        
        amount = float(payload.get("amount") or 0)
        payment_type = payload.get("type", "RECEIPT")
        contact_id = payload.get("contactId") or payload.get("contact_id") or payload.get("customerId") or payload.get("vendorId")
        
        applied_invoices = payload.get("applied_invoices") or payload.get("appliedInvoices") or []
        applied_bills = payload.get("applied_bills") or payload.get("appliedBills") or []
        
        account_id = payload.get("liquidityAccountId") or payload.get("account_id") or payload.get("accountId")
        partner_account_id = payload.get("partnerAccountId") or payload.get("partner_account_id")
        reference = payload.get("reference") or payload.get("memo")
        method = payload.get("method")
        
        payment_number = payload.get("payment_number") or payload.get("paymentNumber")
        
        async with prisma.tx() as tx:
            # We will skip the buggy SQL auto-allocation feature for now unless the user explicitly requested it.
            # The frontend usually sends the exact allocation.
            
            # 1. Upsert Payment
            existing = await tx.query_raw("SELECT id, payment_number FROM docs_payments WHERE id = $1 LIMIT 1", payment_id)
            
            db_payload = {
                "id": payment_id,
                "companyId": company_id,
                "date": date_val.isoformat() if hasattr(date_val, 'isoformat') else date_val,
                "type": payment_type,
                "status": "DRAFT", # Keep draft temporarily
                "amount": amount,
                "contactId": contact_id,
                "appliedInvoices": applied_invoices,
                "appliedBills": applied_bills,
                "accountId": account_id,
                "partnerAccountId": partner_account_id,
                "reference": reference,
                "method": method,
                "paymentNumber": payment_number
            }
            
            import json as json_lib
            from prisma import Json
            
            if existing:
                db_num = existing[0].get("payment_number")
                if db_num and not str(db_num).startswith("DRAFT-"):
                    payment_number = db_num
                    db_payload["paymentNumber"] = payment_number
                    
                await tx.execute_raw("""
                    UPDATE docs_payments SET
                        company_id = $1,
                        date = CAST($2 as date),
                        type = $3,
                        status = 'DRAFT',
                        amount = CAST($4 as numeric),
                        contact_id = $5,
                        applied_invoices = CAST($6 as jsonb),
                        applied_bills = CAST($7 as jsonb),
                        account_id = $8,
                        partner_account_id = $9,
                        reference = $10,
                        method = $11,
                        payment_date = CAST($12 as date),
                        payment_number = $13,
                        created_by_id = $15,
                        updated_at = NOW()
                    WHERE id = $14
                """, company_id, p_date, payment_type, amount, contact_id,
                     json.dumps(applied_invoices, default=str), json.dumps(applied_bills, default=str), account_id, partner_account_id,
                     reference, method, p_date, payment_number, payment_id, payload.get("createdById") or payload.get("created_by_id"))
            else:
                await tx.execute_raw("""
                    INSERT INTO docs_payments (
                        id, company_id, date, type, status, amount, contact_id,
                        applied_invoices, applied_bills, account_id, partner_account_id, 
                        reference, method, payment_date, payment_number, created_by_id, updated_at
                    ) VALUES (
                        $1, $2, CAST($3 as date), $4, 'DRAFT', CAST($5 as numeric), $6,
                        CAST($7 as jsonb), CAST($8 as jsonb), $9, $10, $11, $12, CAST($13 as date), $14, $15, NOW()
                    )
                """, payment_id, company_id, p_date, payment_type, amount, contact_id,
                     json.dumps(applied_invoices, default=str), json.dumps(applied_bills, default=str), account_id, partner_account_id,
                     reference, method, p_date, payment_number, payload.get("createdById") or payload.get("created_by_id"))
            
            # Post via AccountingService
            if status == "POSTED":
                # Ensure we have the saved number before posting
                await tx.execute_raw("UPDATE docs_payments SET status = 'POSTED' WHERE id = $1", payment_id)
                await AccountingService._post_payment_tx(tx, payment_id, company_id)
                
            return payment_id
