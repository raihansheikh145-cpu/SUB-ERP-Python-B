import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.core.db import prisma
from app.api.routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

# Simple in-memory store for async job results
# In a real distributed system, this would be Redis/Celery.
JOB_STORE: Dict[str, Any] = {}

class GenerateReportRequest(BaseModel):
    reportType: str
    companyIds: list[str]
    companyId: str = None
    parameters: dict
    requestedBy: str = "SYSTEM"

@router.post("/generate")
async def generate_report(req: GenerateReportRequest, user=Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    
    # We will process the report synchronously here for simplicity,
    # but return a job_id so the frontend polling works without changes.
    try:
        result_data = await process_report(req)
        JOB_STORE[job_id] = {
            "status": "COMPLETED",
            "result_data": result_data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        JOB_STORE[job_id] = {
            "status": "FAILED",
            "error_message": str(e)
        }

    return {"jobId": job_id}

@router.get("/job/{job_id}")
async def get_job_status(job_id: str, user=Depends(get_current_user)):
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOB_STORE[job_id]

async def process_report(req: GenerateReportRequest):
    rtype = req.reportType
    c_ids = req.companyIds
    params = req.parameters
    
    if not c_ids and req.companyId:
        c_ids = [req.companyId]
        
    if not c_ids or all(cid is None for cid in c_ids):
        return []
        
    c_ids = [cid for cid in c_ids if cid]
    
    start_date = params.get("startDate", "1970-01-01")
    end_date = params.get("endDate", "2099-12-31")
    as_of_date = params.get("asOfDate", end_date)

    if rtype == "TRIAL_BALANCE":
        return await _get_trial_balance(c_ids, start_date, end_date)
    elif rtype == "BALANCE_SHEET":
        return await _get_balance_sheet(c_ids, as_of_date)
    elif rtype == "PROFIT_AND_LOSS":
        return await _get_profit_and_loss(c_ids, start_date, end_date)
    elif rtype == "STOCK_VALUATION":
        return await _get_stock_valuation(c_ids)
    else:
        raise Exception(f"Unknown report type: {rtype}")


async def _get_trial_balance(c_ids: list, start_date: str, end_date: str):
    sql = """
        WITH opening AS (
            SELECT 
                jl.account_id,
                SUM(jl.debit) as ob_debit,
                SUM(jl.credit) as ob_credit
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            WHERE j.status = 'POSTED'
              AND j.company_id = ANY($1::text[])
              AND j.date < $2::date
            GROUP BY jl.account_id
        ),
        period AS (
            SELECT 
                jl.account_id,
                SUM(jl.debit) as p_debit,
                SUM(jl.credit) as p_credit
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            WHERE j.status = 'POSTED'
              AND j.company_id = ANY($1::text[])
              AND j.date >= $2::date
              AND j.date <= $3::date
            GROUP BY jl.account_id
        )
        SELECT 
            a.id as account_id,
            a.code as account_code,
            a.name as account_name,
            a.type as account_type,
            a.company_id as branch_id,
            COALESCE(o.ob_debit, 0) - COALESCE(o.ob_credit, 0) as opening_balance,
            COALESCE(p.p_debit, 0) as period_debit,
            COALESCE(p.p_credit, 0) as period_credit
        FROM docs_accounts a
        LEFT JOIN opening o ON o.account_id = a.id
        LEFT JOIN period p ON p.account_id = a.id
        WHERE a.company_id = ANY($1::text[])
          AND (COALESCE(o.ob_debit, 0) != 0 OR COALESCE(o.ob_credit, 0) != 0 OR COALESCE(p.p_debit, 0) != 0 OR COALESCE(p.p_credit, 0) != 0)
        ORDER BY a.code
    """
    rows = await prisma.query_raw(sql, c_ids, start_date, end_date)
    results = []
    for r in rows:
        ob = float(r["opening_balance"])
        pd = float(r["period_debit"])
        pc = float(r["period_credit"])
        
        # Calculate net activity up to the end_date for Trial Balance
        # Normally net = Total Debit - Total Credit. 
        # A positive net means Debit Balance, negative net means Credit Balance.
        net = ob + pd - pc
        
        db = net if net > 0 else 0
        cb = -net if net < 0 else 0

        if db != 0 or cb != 0:
            results.append({
                "account_id": r["account_id"],
                "account_code": r["account_code"],
                "account_name": r["account_name"],
                "account_type": r["account_type"],
                "branch_id": r["branch_id"],
                "opening_balance": ob,
                "period_debit": pd,
                "period_credit": pc,
                "closing_balance": net,
                "debit_balance": db,
                "credit_balance": cb
            })
    return results

async def _get_balance_sheet(c_ids: list, as_of_date: str):
    sql = """
        SELECT 
            a.id as account_id,
            a.code as account_code,
            a.name as account_name,
            a.type as account_type,
            a.company_id as branch_id,
            SUM(jl.debit) as tot_debit,
            SUM(jl.credit) as tot_credit
        FROM docs_accounts a
        LEFT JOIN (
            SELECT jl.account_id, jl.debit, jl.credit
            FROM docs_journal_lines jl
            JOIN docs_journals j ON jl.journal_id = j.id
            WHERE j.status = 'POSTED' AND j.date <= $2::date
        ) jl ON jl.account_id = a.id
        WHERE a.company_id = ANY($1::text[])
          AND a.type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'COST_OF_REVENUE')
        GROUP BY a.id, a.code, a.name, a.type, a.company_id
        HAVING SUM(jl.debit) != 0 OR SUM(jl.credit) != 0
        ORDER BY a.type, a.code
    """
    rows = await prisma.query_raw(sql, c_ids, as_of_date)
    results = []
    retained_earnings_per_branch = {}
    
    for r in rows:
        d = float(r["tot_debit"] or 0)
        c = float(r["tot_credit"] or 0)
        acc_type = r["account_type"]
        branch = r["branch_id"]
        
        if acc_type in ('REVENUE', 'EXPENSE', 'COST_OF_REVENUE'):
            if branch not in retained_earnings_per_branch:
                retained_earnings_per_branch[branch] = 0
            # Accumulate Net Income into Retained Earnings
            net = c - d if acc_type == 'REVENUE' else d - c
            if acc_type == 'REVENUE':
                retained_earnings_per_branch[branch] += net
            else:
                retained_earnings_per_branch[branch] -= net
            continue
            
        bal = d - c if acc_type == 'ASSET' else c - d
        
        # Determine GAAP section and group based on account code conventions or type
        section = 'ASSETS' if acc_type == 'ASSET' else 'LIABILITIES & EQUITY'
        
        # Simple heuristic for Current vs Non-Current based on generic accounting codes if subtype is missing
        # Usually 100xxx-150xxx is Current, >150xxx is Non-Current
        group = 'Other'
        if acc_type == 'ASSET':
            group = 'Current Assets' if r["account_code"].startswith('10') or r["account_code"].startswith('11') else 'Non-Current Assets'
        elif acc_type == 'LIABILITY':
            group = 'Current Liabilities' if r["account_code"].startswith('20') or r["account_code"].startswith('21') else 'Long-Term Liabilities'
        elif acc_type == 'EQUITY':
            group = 'Equity'
            
        if bal != 0:
            results.append({
                "account_id": r["account_id"],
                "account_code": r["account_code"],
                "account_name": r["account_name"],
                "account_type": r["account_type"],
                "branch_id": branch,
                "balance": bal,
                "section": section,
                "account_group": group
            })
            
    for branch, retained_earnings in retained_earnings_per_branch.items():
        if retained_earnings != 0:
            results.append({
                "account_id": f"RETAINED-EARNINGS-AUTO-{branch}",
                "account_code": "399999",
                "account_name": "Retained Earnings (Current Period)",
                "account_type": "EQUITY",
                "branch_id": branch,
                "balance": retained_earnings,
                "section": "LIABILITIES & EQUITY",
                "account_group": "Equity"
            })
        
    return results

async def _get_profit_and_loss(c_ids: list, start_date: str, end_date: str):
    sql = """
        SELECT 
            a.id as account_id,
            a.code as account_code,
            a.name as account_name,
            a.type as account_type,
            a.company_id as branch_id,
            SUM(jl.debit) as tot_debit,
            SUM(jl.credit) as tot_credit
        FROM docs_accounts a
        JOIN docs_journal_lines jl ON jl.account_id = a.id
        JOIN docs_journals j ON jl.journal_id = j.id
        WHERE a.company_id = ANY($1::text[])
          AND j.status = 'POSTED'
          AND j.date >= $2::date
          AND j.date <= $3::date
          AND a.type IN ('REVENUE', 'EXPENSE', 'COST_OF_REVENUE')
        GROUP BY a.id, a.code, a.name, a.type, a.company_id
    """
    rows = await prisma.query_raw(sql, c_ids, start_date, end_date)
    results = []
    for r in rows:
        d = float(r["tot_debit"] or 0)
        c = float(r["tot_credit"] or 0)
        bal = c - d if r["account_type"] == 'REVENUE' else d - c
        
        if bal != 0:
            results.append({
                "account_id": r["account_id"],
                "account_code": r["account_code"],
                "account_name": r["account_name"],
                "account_type": r["account_type"],
                "branch_id": r["branch_id"],
                "balance": bal
            })
    return results

async def _get_stock_valuation(c_ids: list):
    sql = """
        SELECT 
            p.id as product_id,
            p.name as product_name,
            p.sku,
            p.company_id,
            COALESCE(p.cost, 0) as unit_cost,
            SUM(il.quantity) as on_hand_qty
        FROM docs_products p
        JOIN docs_inventory_ledger il ON il.product_id = p.id
        WHERE p.company_id = ANY($1::text[])
        GROUP BY p.id, p.name, p.sku, p.company_id, p.cost
        HAVING SUM(il.quantity) > 0
    """
    rows = await prisma.query_raw(sql, c_ids)
    results = []
    for r in rows:
        qty = float(r["on_hand_qty"])
        cost = float(r["unit_cost"])
        results.append({
            "company_id": r["company_id"],
            "product_id": r["product_id"],
            "product_name": r["product_name"],
            "sku": r["sku"],
            "unit_cost": cost,
            "on_hand_qty": qty,
            "total_value": cost * qty
        })
    return results

