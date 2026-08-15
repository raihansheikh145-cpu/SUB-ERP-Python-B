from fastapi import APIRouter, Depends, HTTPException, Request
import logging
import json
import uuid
from app.core.db import prisma
from app.core.security import get_current_user, require_roles
from datetime import datetime

router = APIRouter(tags=["Loans"])
logger = logging.getLogger(__name__)

@router.post("/post")
async def post_loan(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_loan_id = body.get("p_loan_id")
        
        if not p_loan_id:
            return {"success": False, "error": "Loan ID is required"}

        rpc_res = await prisma.query_raw(
            'SELECT * FROM post_loan_rpc($1::text)',
            p_loan_id
        )

        res_data = rpc_res[0] if rpc_res and len(rpc_res) > 0 else {}
        logger.info(f"Loan {p_loan_id} posted successfully.")
        
        return {"success": True, **res_data}

    except Exception as err:
        logger.error(f"Failed to post loan: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/payment")
async def post_loan_payment(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_loan_id = body.get("p_loan_id")
        p_period = body.get("p_period")
        p_date = body.get("p_date")
        p_interest_to_pay = float(body.get("p_interest_to_pay", 0))
        p_principal_to_pay = float(body.get("p_principal_to_pay", 0))
        
        # 1. Amortization Math Verification
        loan_res = await prisma.query_raw(
            'SELECT amortization_schedule, status, company_id FROM docs_loans WHERE id = $1 LIMIT 1',
            p_loan_id
        )
        
        if not loan_res or len(loan_res) == 0:
            return {"success": False, "error": "Loan not found"}
            
        loan = loan_res[0]
        if loan.get("status") not in ("POSTED", "ACTIVE"):
            return {"success": False, "error": "Loan must be posted before making payments"}

        schedule = loan.get("amortization_schedule")
        if isinstance(schedule, str):
            try:
                schedule = json.loads(schedule)
            except Exception:
                schedule = []
                
        if not isinstance(schedule, list):
            return {"success": False, "error": "Invalid amortization schedule format in database"}

        period_data = next((s for s in schedule if int(s.get("period", -1)) == int(p_period)), None)
        if not period_data:
            return {"success": False, "error": f"Period {p_period} not found in schedule."}

        company_id = loan.get("company_id")

        # 2. Execute Secure Database RPC which perfectly handles the GAAP compliant journal entry

        # 3. Execute Secure Database RPC
        rpc_res = await prisma.query_raw(
            'SELECT * FROM post_loan_payment_rpc($1::text, $2::int, $3::text, $4::numeric, $5::numeric)',
            p_loan_id,
            int(p_period),
            p_date,
            p_interest_to_pay,
            p_principal_to_pay
        )

        res_data = rpc_res[0] if rpc_res and len(rpc_res) > 0 else {}
        logger.info(f"Loan payment for period {p_period} posted successfully.")
        
        return {"success": True, **res_data}

    except Exception as err:
        logger.error(f"Failed to process loan payment: {err}")
        raise HTTPException(status_code=500, detail=str(err))
