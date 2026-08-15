from fastapi import APIRouter, Depends, HTTPException, Request
import logging
from datetime import datetime, date
import uuid
from typing import Dict, Any

from app.core.db import prisma
from app.core.security import require_roles
from app.services.invoice_service import InvoiceService
from app.schemas.invoice import InvoiceCreate, InvoiceLineCreate

router = APIRouter(tags=["Invoices"])
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
async def create_invoice(req: Request, user=Depends(require_roles(["ADMIN", "SALES_REP", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        p_invoice = body.get("p_invoice")
        
        print("RAW FRONTEND PAYLOAD:", p_invoice.get("createdById"), p_invoice.get("created_by_id"))
        logger.warning(f"RAW FRONTEND PAYLOAD: createdById={p_invoice.get('createdById')}")
        
        if not p_invoice or not p_invoice.get("items"):
            return {"success": False, "error": "Invalid invoice payload"}
            
        # Parse items to Pydantic
        items = []
        for it in p_invoice.get("items", []):
            items.append(InvoiceLineCreate(
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
                uom=it.get("uom"),
                displayDescription=it.get("displayDescription"),
                serialNumbers=it.get("serialNumbers", []),
                displayIndex=int(it.get("displayIndex") or 0)
            ))
            
        # Parse payload to Pydantic
        payload = InvoiceCreate(
            id=p_invoice.get("id"),
            invoiceNumber=p_invoice.get("invoiceNumber") or p_invoice.get("invoice_number"),
            companyId=p_invoice.get("companyId") or p_invoice.get("company_id"),
            date=parse_date(p_invoice.get("date") or p_invoice.get("invoiceDate")),
            invoiceDate=parse_date(p_invoice.get("invoiceDate") or p_invoice.get("date")),
            dueDate=parse_date(p_invoice.get("dueDate")) if p_invoice.get("dueDate") else None,
            customerId=p_invoice.get("customerId") or p_invoice.get("customer_id"),
            contactId=p_invoice.get("contactId") or p_invoice.get("contact_id"),
            status=p_invoice.get("status") or "DRAFT",
            reference=p_invoice.get("reference"),
            salesperson=p_invoice.get("salesperson"),
            customerNote=p_invoice.get("customerNote"),
            deliveryPerson=p_invoice.get("deliveryPerson"),
            createdById=p_invoice.get("createdById") or p_invoice.get("created_by_id"),
            items=items,
            messages=p_invoice.get("messages", [])
        )
        
        logger.warning(f"Received payload for invoice creation: createdById={p_invoice.get('createdById')}, resolved_to={payload.created_by_id}")
        
        # Save via Service (Transactional, No DB Triggers for totals)
        invoice_id = await InvoiceService.save_invoice(prisma, payload)
        
        return {"success": True, "processed_invoice": {"id": invoice_id}}
        
    except Exception as err:
        logger.error(f"Failed to process invoice: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/post")
async def post_invoice(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        inv_id = body.get("p_invoice_id")
        
        if not inv_id:
            return {"success": False, "error": "Missing invoice ID"}
            
        # Use the new Python AccountingService
        from app.services.accounting_service import AccountingService
        res = await AccountingService.post_invoice(prisma, inv_id)
        
        return {"success": True, "data": res}
    except Exception as e:
        logger.error(f"Failed to post invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))
