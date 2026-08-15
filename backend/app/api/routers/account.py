from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["Accounts"])
logger = logging.getLogger(__name__)

class UpsertAccountRequest(BaseModel):
    id: str
    data: Any

@router.get("")
async def get_accounts(user=Depends(get_current_user)):
    try:
        rows = await prisma.query_raw('SELECT * FROM docs_accounts LIMIT 1000')
        accounts = []
        for row in rows:
            accounts.append(row)
        return {"success": True, "data": accounts}
    except Exception as err:
        logger.error(f"Error fetching accounts: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/upsert")
async def upsert_account(req: UpsertAccountRequest, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        # Server-side validations
        if not req.data or not req.data.get("name") or not req.data.get("type"):
            return {"success": False, "error": "Account name and type are required"}

        # Perform upsert via raw query since docs_accounts is missing from Prisma schema
        # Equivalent to: INSERT INTO docs_accounts (id, data) VALUES (...) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
        # Extract fields from req.data
        company_id = req.data.get("companyId") or req.data.get("company_id")
        name = req.data.get("name")
        code = req.data.get("code")
        acc_type = req.data.get("type")
        sub_type = req.data.get("subType") or req.data.get("sub_type")
        
        # Auto-generate code if empty
        if not code or str(code).strip() == "":
            prefix_map = {
                "ASSET": "1",
                "LIABILITY": "2",
                "EQUITY": "3",
                "REVENUE": "4",
                "COST_OF_REVENUE": "5",
                "EXPENSE": "6",
                "OTHER_REVENUE": "7",
                "OTHER_EXPENSE": "8"
            }
            prefix = prefix_map.get(str(acc_type).upper(), "9")
            
            # Find the max code for this type that starts with this prefix
            max_code_rows = await prisma.query_raw(
                "SELECT code FROM docs_accounts WHERE type = $1 AND code LIKE $2 ORDER BY code DESC LIMIT 1", 
                acc_type, 
                f"{prefix}%"
            )
            
            if max_code_rows and len(max_code_rows) > 0 and max_code_rows[0].get("code"):
                last_code_str = max_code_rows[0]["code"]
                try:
                    last_code_int = int(last_code_str)
                    code = str(last_code_int + 1)
                except ValueError:
                    code = f"{prefix}00100"
            else:
                code = f"{prefix}00100"

        await prisma.execute_raw(
            '''
            INSERT INTO docs_accounts (id, company_id, name, code, type, sub_type, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, now()) 
            ON CONFLICT (id) DO UPDATE SET 
                company_id = COALESCE(EXCLUDED.company_id, docs_accounts.company_id),
                name = EXCLUDED.name,
                code = COALESCE(NULLIF(EXCLUDED.code, ''), docs_accounts.code),
                type = EXCLUDED.type,
                sub_type = EXCLUDED.sub_type,
                updated_at = now()
            ''',
            req.id,
            company_id,
            name,
            code,
            acc_type,
            sub_type
        )

        logger.info(f"Account {req.id} upserted successfully.")
        return {"success": True, "message": "Account upserted successfully"}

    except Exception as err:
        logger.error(f"Failed to upsert account: {err}")
        raise HTTPException(status_code=500, detail=str(err))
