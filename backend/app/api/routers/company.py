from fastapi import APIRouter, Depends, HTTPException, Body
import logging
from app.core.db import prisma
from app.core.security import get_current_user, require_roles
from pydantic import BaseModel
import json

router = APIRouter(tags=["Companies"])
logger = logging.getLogger(__name__)

@router.get("")
async def get_companies(user=Depends(get_current_user)):
    try:
        # Use query_raw to fetch all from docs_companies since it might not be in Prisma schema
        rows = await prisma.query_raw('SELECT * FROM docs_companies')
        
        companies = []
        for row in rows:
            company = dict(row)
            companies.append(company)
            
        print("COMPANIES RESPONSE:", companies)
        return {"success": True, "data": companies}
    except Exception as err:
        logger.error(f"Error fetching companies: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

class CompanyUserRequest(BaseModel):
    user_id: str
    company_id: str
    role: str

@router.post("/users")
async def assign_user_to_company(req: CompanyUserRequest, user=Depends(require_roles(["ADMIN"]))):
    try:
        # We use query_raw here if company_users is not in Prisma schema
        await prisma.execute_raw(
            'INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, company_id) DO UPDATE SET role = $3',
            req.user_id, req.company_id, req.role
        )
        return {"success": True}
    except Exception as err:
        logger.error(f"Error assigning user to company: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")
