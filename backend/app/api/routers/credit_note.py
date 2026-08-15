from fastapi import APIRouter, Depends, HTTPException, Request
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["CreditNotes"])
logger = logging.getLogger(__name__)

@router.post("/create")
async def create_credit_note(req: Request, user=Depends(require_roles(["ADMIN", "SALES_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_cn = body.get("p_cn")
        
        if not p_cn:
            return {"success": False, "error": "Credit Note data is required"}


        from app.services.credit_note_service import CreditNoteService
        cn_id = await CreditNoteService.save_credit_note(prisma, p_cn)

        return {"success": True, "credit_note_id": cn_id}

    except Exception as err:
        logger.error(f"Failed to create credit note: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/process")
async def process_credit_note(req: Request, user=Depends(require_roles(["ADMIN", "SALES_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_cn = body.get("p_cn")
        
        if not p_cn:
            return {"success": False, "error": "Credit Note data is required"}

        from app.services.credit_note_service import CreditNoteService
        cn_id = await CreditNoteService.save_credit_note(prisma, p_cn)

        return {"success": True, "credit_note_id": cn_id}

    except Exception as err:
        logger.error(f"Failed to process credit note: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/apply")
async def apply_credit(req: Request, user=Depends(require_roles(["ADMIN", "SALES_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        cn_id = body.get("credit_note_id")
        inv_id = body.get("invoice_id")
        amount = float(body.get("amount") or 0)
        
        if not cn_id or not inv_id or amount <= 0:
            return {"success": False, "error": "Invalid application details"}
            
        async with prisma.tx() as tx:
            cn = await tx.query_raw("SELECT * FROM docs_credit_notes WHERE id = $1 LIMIT 1", cn_id)
            inv = await tx.query_raw("SELECT * FROM docs_invoices WHERE id = $1 LIMIT 1", inv_id)
            
            if not cn or not inv:
                return {"success": False, "error": "Document not found"}
                
            company_id = cn[0].get("company_id")
            contact_id = cn[0].get("customer_id")
            
            import uuid
            payment_id = f"PAY-CN-{str(uuid.uuid4())[:8].upper()}"
            
            await tx.execute_raw("""
                INSERT INTO docs_payments (
                    id, company_id, date, type, status, amount, contact_id,
                    applied_invoices, payment_date, payment_number, created_by_id, updated_at
                ) VALUES (
                    $1, $2, NOW()::date, 'CREDIT_NOTE', 'POSTED', CAST($3 as numeric), $4,
                    CAST($5 as jsonb), NOW()::date, $6, $7, NOW()
                )
            """, payment_id, company_id, amount, contact_id,
                 json.dumps([{"invoiceId": inv_id, "amount": amount}]), 
                 f"CN-APPLY-{str(uuid.uuid4())[:6].upper()}", user.get("id"))
            
        return {"success": True, "payment_id": payment_id}
    except Exception as err:
        logger.error(f"Failed to apply credit note: {err}")
        raise HTTPException(status_code=500, detail=str(err))
