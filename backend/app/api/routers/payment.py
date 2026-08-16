from fastapi import APIRouter, Depends, HTTPException, Request
import logging
import json
import re
from app.core.db import prisma
from app.core.security import get_current_user, require_roles
from app.core.sequence import get_next_sequence_number
import uuid

router = APIRouter(tags=["Payments"])
logger = logging.getLogger(__name__)

@router.post("/process")
async def process_payment(req: Request, user=Depends(require_roles(["ADMIN", "PURCHASING_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_payment = body.get("p_payment")
        idempotency_key = req.headers.get("x-idempotency-key") or (p_payment.get("id") if p_payment else None)

        if not p_payment or not p_payment.get("amount") or float(p_payment.get("amount", 0)) <= 0:
            return {"success": False, "error": "Invalid payment amount"}

        if not p_payment.get('id') or len(p_payment.get('id', '')) < 10:
            p_payment['id'] = str(uuid.uuid4())
            
        company_id = p_payment.get("companyId") or p_payment.get("company_id")
        status = p_payment.get('status', 'DRAFT')
        ref = p_payment.get('payment_number') or p_payment.get('reference')
        if status not in ('DRAFT', 'DELETED', 'VOID') and (not ref or str(ref).startswith('DRAFT-') or ref == 'NEW'):
            p_payment['payment_number'] = await get_next_sequence_number("PAYMENT", company_id, "PAY")
            p_payment['reference'] = p_payment['payment_number']

        idempotency_key = req.headers.get("x-idempotency-key") or p_payment.get("id")

        # 1. Idempotency Protection
        if idempotency_key:
            existing_payment = await prisma.query_raw(
                'SELECT id FROM docs_payments WHERE id = $1 LIMIT 1',
                idempotency_key
            )
            if existing_payment and len(existing_payment) > 0:
                logger.warning(f"Idempotency triggered. Payment {idempotency_key} already exists.")
                return {"success": True, "message": "Payment already processed", "paymentId": idempotency_key}

        # 2. Overpayment Protection
        if p_payment.get("applied_invoices") and len(p_payment["applied_invoices"]) > 0:
            for app in p_payment["applied_invoices"]:
                invoice_id = app.get("invoiceId")
                app_amount = float(app.get("amount", 0))
                
                invoice_res = await prisma.query_raw(
                    '''SELECT i.total,
                              COALESCE(SUM(p.amount), 0) AS paid_amount
                       FROM docs_invoices i
                       LEFT JOIN docs_payments p ON p.status IN ('POSTED','CLEARED')
                           AND p.company_id = i.company_id
                           AND EXISTS (
                               SELECT 1 FROM jsonb_array_elements(p.applied_invoices) al
                               WHERE al->>'invoiceId' = i.id
                           )
                       WHERE i.id = $1
                       GROUP BY i.total''',
                    invoice_id
                )
                if invoice_res and len(invoice_res) > 0:
                    inv_total = float(invoice_res[0].get("total", 0))
                    paid = float(invoice_res[0].get("paid_amount", 0))
                    due = max(inv_total - paid, 0)
                    
                    if app_amount > due + 0.01:
                        logger.warning(f"Overpayment blocked for invoice {invoice_id}. Attempted: {app_amount}, Due: {due}")
                        return {"success": False, "error": f"Overpayment blocked. Invoice {app.get('invoiceNumber') or invoice_id} has only {due:.2f} remaining."}
                        
        if p_payment.get("applied_bills") and len(p_payment["applied_bills"]) > 0:
            for app in p_payment["applied_bills"]:
                bill_id = app.get("billId")
                app_amount = float(app.get("amount", 0))
                
                bill_res = await prisma.query_raw(
                    '''SELECT b.total,
                              COALESCE(SUM(p.amount), 0) AS paid_amount
                       FROM docs_bills b
                       LEFT JOIN docs_payments p ON p.status IN ('POSTED','CLEARED')
                           AND p.company_id = b.company_id
                           AND EXISTS (
                               SELECT 1 FROM jsonb_array_elements(p.applied_bills) al
                               WHERE al->>'billId' = b.id
                           )
                       WHERE b.id = $1
                       GROUP BY b.total''',
                    bill_id
                )
                if bill_res and len(bill_res) > 0:
                    bill_total = float(bill_res[0].get("total", 0))
                    paid = float(bill_res[0].get("paid_amount", 0))
                    due = max(bill_total - paid, 0)
                    
                    if app_amount > due + 0.01:
                        logger.warning(f"Overpayment blocked for bill {bill_id}. Attempted: {app_amount}, Due: {due}")
                        return {"success": False, "error": f"Overpayment blocked. Bill {app.get('billNumber') or bill_id} has only {due:.2f} remaining."}

        # 3. Use Python PaymentService
        from app.services.payment_service import PaymentService
        payment_id = await PaymentService.save_payment(prisma, p_payment)
        
        # Post to Ledger is handled inside PaymentService.save_payment transactionally
        logger.info(f"Payment {p_payment.get('id')} processed securely for amount {p_payment.get('amount')}")
        
        return {"success": True, "paymentId": payment_id}

    except Exception as err:
        logger.error(f"Failed to process payment: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/batch")
async def process_batch_payment(req: Request, user=Depends(require_roles(["ADMIN", "PURCHASING_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        payload = body.get("payload")
        
        if not payload or not payload.get("amount") or float(payload.get("amount", 0)) <= 0:
            return {"success": False, "error": "Invalid payment amount"}

        amount = float(payload.get("amount", 0))
        company_id = payload.get("companyId") or payload.get("company_id")
        memo = payload.get("memo") or payload.get("reference") or ""
        date = payload.get("date", "")

        # Normalize company_id key for DB RPC
        if company_id:
            payload["company_id"] = company_id

        # ── Step 1: Auto-build applied_invoices / applied_bills from simple ID lists ──
        invoice_ids = payload.get("invoiceIds") or payload.get("invoice_ids") or []
        bill_ids = payload.get("billIds") or payload.get("bill_ids") or []

        if invoice_ids and not payload.get("applied_invoices"):
            applied_invoices = []
            remaining = amount
            for inv_id in invoice_ids:
                if remaining <= 0:
                    break
                inv_res = await prisma.query_raw(
                    '''SELECT i.id, i.total, i.invoice_number,
                              COALESCE(SUM(p.amount), 0) AS paid_amount
                       FROM docs_invoices i
                       LEFT JOIN docs_payments p ON p.status IN ('POSTED','CLEARED')
                           AND p.company_id = i.company_id
                           AND EXISTS (
                               SELECT 1 FROM jsonb_array_elements(p.applied_invoices) al
                               WHERE al->>'invoiceId' = i.id
                           )
                       WHERE i.id = $1
                       GROUP BY i.id, i.total, i.invoice_number''',
                    inv_id
                )
                if inv_res:
                    inv = inv_res[0]
                    inv_total = float(inv.get("total") or 0)
                    paid = float(inv.get("paid_amount") or 0)
                    inv_due = max(inv_total - paid, 0)
                    alloc = round(min(remaining, inv_due), 2)
                    if alloc > 0:
                        applied_invoices.append({
                            "invoiceId": inv_id,
                            "amount": alloc,
                            "invoiceNumber": inv.get("invoice_number") or ""
                        })
                        remaining -= alloc
            payload["applied_invoices"] = applied_invoices

        if bill_ids and not payload.get("applied_bills"):
            applied_bills = []
            remaining = amount
            for bill_id in bill_ids:
                if remaining <= 0:
                    break
                bill_res = await prisma.query_raw(
                    '''SELECT b.id, b.total, b.bill_number,
                              COALESCE(SUM(p.amount), 0) AS paid_amount
                       FROM docs_bills b
                       LEFT JOIN docs_payments p ON p.status IN ('POSTED','CLEARED')
                           AND p.company_id = b.company_id
                           AND EXISTS (
                               SELECT 1 FROM jsonb_array_elements(p.applied_bills) al
                               WHERE al->>'billId' = b.id
                           )
                       WHERE b.id = $1
                       GROUP BY b.id, b.total, b.bill_number''',
                    bill_id
                )
                if bill_res:
                    bill = bill_res[0]
                    bill_total = float(bill.get("total") or 0)
                    paid = float(bill.get("paid_amount") or 0)
                    bill_due = max(bill_total - paid, 0)
                    alloc = round(min(remaining, bill_due), 2)
                    if alloc > 0:
                        applied_bills.append({
                            "billId": bill_id,
                            "amount": alloc,
                            "billNumber": bill.get("bill_number") or ""
                        })
                        remaining -= alloc
            payload["applied_bills"] = applied_bills

        
        # ── Step 2: Duplicate Prevention ──
        if memo and company_id:
            base_memo = re.sub(r'-P\d+$', '', memo) if re.search(r'-P\d+$', memo) else memo
            same_memo_payments = await prisma.query_raw(
                '''
                SELECT reference as m, amount as a, payment_date as d
                FROM docs_payments
                WHERE company_id = $1 AND reference LIKE $2
                ''',
                company_id, f"{base_memo}%"
            )
            if same_memo_payments and len(same_memo_payments) > 0:
                for p in same_memo_payments:
                    if p.get("m") == memo and abs(float(p.get("a") or 0) - amount) < 0.01 and p.get("d") == date:
                        logger.warning(f"Batch Payment blocked: Exact duplicate for memo '{memo}'")
                        return {"success": False, "error": "Duplicate payment detected. A payment with this reference, amount, and date already exists."}
                suffix_count = len(same_memo_payments)
                payload["memo"] = f"{base_memo}-P{suffix_count}"
                logger.info(f"Auto-suffix applied: '{memo}' -> '{payload['memo']}'")

        # ── Step 3: Math Verification (only when applied arrays are present) ──
        applied_inv = payload.get("applied_invoices") or []
        applied_bill = payload.get("applied_bills") or []
        if applied_inv or applied_bill:
            calculated_total = sum(float(a.get("amount", 0)) for a in applied_inv) + \
                               sum(float(a.get("amount", 0)) for a in applied_bill)
            if abs(calculated_total - amount) > 0.10:
                logger.warning(f"Batch Payment Math Failed. Calculated: {calculated_total}, Submitted: {amount}")
                return {
                    "success": False,
                    "error": f"Math verification failed. Applied total ({calculated_total:.2f}) doesn't match payment ({amount:.2f})."
                }

        # 3. Use Python PaymentService
        from app.services.payment_service import PaymentService
        payment_id = await PaymentService.save_payment(prisma, payload)
        
        status = payload.get('status', 'POSTED')
        if status == 'POSTED':
            from app.services.accounting_service import AccountingService
            await AccountingService.post_payment(prisma, payment_id, company_id)

        logger.info(f"Batch Payment processed securely for amount {amount}")
        
        return {"success": True, "paymentId": payment_id}

    except Exception as err:
        logger.error(f"Failed to process batch payment: {err}")
        return {"success": False, "error": str(err)}

@router.post("/clear")
async def clear_payment(req: Request, user=Depends(require_roles(["ADMIN", "PURCHASING_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        payment_id = body.get("payment_id")
        company_id = body.get("company_id")
        
        if not payment_id:
            return {"success": False, "error": "Payment ID is required"}
            
        # Verify and update
        query = """
        UPDATE docs_payments
        SET status = 'CLEARED',
            updated_at = NOW()
        WHERE id = $1 AND (company_id = $2 OR $2 IS NULL)
        RETURNING id;
        """
        result = await prisma.query_raw(query, payment_id, company_id)
        
        if not result or len(result) == 0:
            return {"success": False, "error": "Payment not found or access denied"}
            
        return {"success": True, "message": "Payment cleared successfully"}
    except Exception as err:
        logger.error(f"Failed to clear payment: {err}")
        raise HTTPException(status_code=500, detail=str(err))
