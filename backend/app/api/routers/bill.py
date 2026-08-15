from fastapi import APIRouter, Depends, HTTPException, Request
import logging
from datetime import datetime, date

from app.core.db import prisma
from app.core.security import require_roles
from app.services.bill_service import BillService
from app.schemas.bill import BillCreate, BillLineCreate

router = APIRouter(tags=["Bills"])
logger = logging.getLogger(__name__)

def parse_date(date_str: str) -> date:
    if not date_str:
        return date.today()
    try:
        if "T" in date_str:
            return datetime.strptime(date_str.split("T")[0], "%Y-%m-%d").date()
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return date.today()

@router.post("/create")
async def create_bill(req: Request, user=Depends(require_roles(["ADMIN", "PURCHASING_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_bill = body.get("p_bill")
        
        if not p_bill or not p_bill.get("items"):
            return {"success": False, "error": "Invalid bill payload"}
            
        # Parse items to Pydantic
        items = []
        for it in p_bill.get("items", []):
            items.append(BillLineCreate(
                id=it.get("id"),
                productId=it.get("productId") or it.get("product_id"),
                quantity=float(it.get("quantity") or 0),
                unitPrice=float(it.get("unitPrice") or it.get("unit_price") or 0),
                discountAmount=float(it.get("discountAmount") or it.get("discount") or 0),
                discountRate=float(it.get("discountRate") or 0),
                discountMode=it.get("discountMode") or "PERCENT",
                taxValue=float(it.get("taxValue") or it.get("taxAmount") or 0),
                taxRate=float(it.get("taxRate") or 0),
                lineValue=float(it.get("lineValue") or it.get("total") or 0),
                description=it.get("description"),
                type=it.get("type", "PRODUCT"),
                serialNumbers=it.get("serialNumbers", []),
                displayIndex=int(it.get("displayIndex") or 0)
            ))
            
        # Parse payload to Pydantic
        payload = BillCreate(
            id=p_bill.get("id"),
            billNumber=p_bill.get("billNumber") or p_bill.get("bill_number"),
            companyId=p_bill.get("companyId") or p_bill.get("company_id"),
            date=parse_date(p_bill.get("date") or p_bill.get("billDate")),
            billDate=parse_date(p_bill.get("billDate") or p_bill.get("date")),
            dueDate=parse_date(p_bill.get("dueDate")) if p_bill.get("dueDate") else None,
            vendorId=p_bill.get("vendorId") or p_bill.get("vendor_id"),
            contactId=p_bill.get("contactId") or p_bill.get("contact_id"),
            status=p_bill.get("status") or "DRAFT",
            reference=p_bill.get("reference"),
            salesperson=p_bill.get("salesperson"),
            customerNote=p_bill.get("customerNote"),
            deliveryPerson=p_bill.get("deliveryPerson"),
            createdById=p_bill.get("createdById") or p_bill.get("created_by_id"),
            items=items,
            messages=p_bill.get("messages", [])
        )
        
        # Save via Service (Transactional, No DB Triggers for totals)
        bill_id = await BillService.save_bill(prisma, payload)
        
        return {"success": True, "processed_bill": {"id": bill_id}}
        
    except Exception as err:
        logger.error(f"Failed to process bill: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/post")
async def post_bill(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        bill_id = body.get("p_bill_id")
        
        if not bill_id:
            return {"success": False, "error": "Missing bill ID"}
            
        # Use the new Python AccountingService
        from app.services.accounting_service import AccountingService
        res = await AccountingService.post_bill(prisma, bill_id)
        
        return {"success": True, "data": res}
    except Exception as e:
        logger.error(f"Failed to post bill: {e}")
        return {"success": False, "error": str(e)}
