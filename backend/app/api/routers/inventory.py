from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import uuid
import logging
from datetime import datetime
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["Inventory"])
logger = logging.getLogger(__name__)

@router.get("/valuation")
async def get_inventory_valuation(companyId: str, user=Depends(get_current_user)):
    try:
        # Calculate WAC and stock levels directly in Postgres
        query = """
        SELECT 
            p.id,
            p.name,
            p.sku,
            COALESCE(p.category, 'Uncategorized') as category,
            COALESCE(p.brand, 'No Brand') as brand,
            COALESCE(p.price, 0) as price,
            COALESCE(p.cost_price, 0) as fallback_cost,
            COALESCE(
                (SELECT SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END) 
                 FROM docs_inventory_transactions WHERE product_id = p.id AND company_id = $1), 0
            ) as qty_in,
            COALESCE(
                (SELECT SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END) 
                 FROM docs_inventory_transactions WHERE product_id = p.id AND company_id = $1), 0
            ) as qty_out,
            COALESCE(
                (SELECT SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE -quantity END) 
                 FROM docs_inventory_transactions WHERE product_id = p.id AND company_id = $1), 0
            ) as quantity_on_hand,
            COALESCE(
                (SELECT SUM(line_value) / NULLIF(SUM(quantity), 0)
                 FROM docs_bill_lines bl
                 JOIN docs_bills b ON bl.bill_id = b.id
                 WHERE bl.product_id = p.id AND b.company_id = $1),
                COALESCE(p.cost_price, 0)
            ) as wac,
            COALESCE(
                (SELECT SUM(CASE WHEN transaction_type = 'OUT' THEN quantity * COALESCE(cost_price, 0) ELSE 0 END)
                 FROM docs_inventory_transactions WHERE product_id = p.id AND company_id = $1), 0
            ) as cogs
        FROM docs_products p
        WHERE p.company_id = $1
        """
        rows = await prisma.query_raw(query, companyId)
        
        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "name": r.get("name", ""),
                "sku": r.get("sku", ""),
                "category": r.get("category", ""),
                "brand": r.get("brand", ""),
                "price": float(r.get("price") or 0),
                "costPrice": float(r.get("wac") or r.get("fallback_cost") or 0),
                "qtyIn": float(r.get("qty_in") or 0),
                "qtyOut": float(r.get("qty_out") or 0),
                "quantityOnHand": float(r.get("quantity_on_hand") or 0),
                "cogs": float(r.get("cogs") or 0)
            })
            
        return {"success": True, "data": results}
    except Exception as err:
        logger.error(f"Error fetching inventory valuation: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

class AdjustInventoryRequest(BaseModel):
    productId: str
    warehouseId: Optional[str] = None
    quantity: float
    reason: str
    companyId: str

@router.post("/adjust")
async def adjust_inventory(req: AdjustInventoryRequest, user=Depends(require_roles(["ADMIN", "INVENTORY_MANAGER", "ACCOUNTANT"]))):
    try:
        user_id = user.get("id") if user else None
        
        if req.quantity == 0:
            return {"success": False, "error": "Adjustment quantity cannot be zero"}
            
        # 1. Fetch current product to get cost price
        product = await prisma.docsproduct.find_unique(
            where={"id": req.productId}
        )
        
        if not product:
            return {"success": False, "error": "Product not found"}
            
        # Note: In Prisma schema, track_inventory might not be mapped in DocsProduct 
        # (Wait, let's just use raw query to be completely safe since it might be inside JSON data)
        # Actually, let's fetch using raw query to match the previous structure
        prod_raw = await prisma.query_raw(
            'SELECT cost_price, data->>\'track_inventory\' as track_inventory FROM docs_products WHERE id = $1',
            req.productId
        )
        if not prod_raw or len(prod_raw) == 0:
            return {"success": False, "error": "Product not found"}
            
        prod = prod_raw[0]
        track_inv = str(prod.get("track_inventory")).lower() == "true"
        # If it's a regular field and not in JSON:
        if "track_inventory" not in prod or prod["track_inventory"] is None:
             # Just assume true if it's missing but we know it's an inventory item
             track_inv = True

        if not track_inv:
            return {"success": False, "error": "Product does not track inventory"}

        # 2. Insert into docs_inventory_transactions
        transaction_id = str(uuid.uuid4())
        txn_type = "ADJUSTMENT_IN" if req.quantity > 0 else "ADJUSTMENT_OUT"
        
        await prisma.execute_raw(
            '''
            INSERT INTO docs_inventory_transactions (
                id, company_id, product_id, warehouse_id, transaction_type, 
                quantity, cost_price, reference_type, reference_id, created_by_id, date, updated_at, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now()
            )
            ''',
            transaction_id,
            req.companyId,
            req.productId,
            req.warehouseId,
            txn_type,
            req.quantity,
            prod.get("cost_price", 0),
            "MANUAL_ADJUSTMENT",
            req.reason,
            user_id,
            datetime.utcnow().isoformat()
        )
        
        logger.info(f"Inventory adjusted for product {req.productId} by {req.quantity}")
        return {"success": True, "transactionId": transaction_id}
        
    except Exception as err:
        logger.error(f"Failed to adjust inventory: {err}")
        raise HTTPException(status_code=500, detail=str(err))

class InventoryLedgerRequest(BaseModel):
    p_company_ids: list[str]
    p_product_ids: Optional[list[str]] = None
    p_start_date: str = '1970-01-01'
    p_end_date: str = '2099-12-31'

@router.post("/ledger")
async def get_inventory_ledger(req: InventoryLedgerRequest, user=Depends(get_current_user)):
    try:
        # Prepare params
        company_ids_str = "','".join(req.p_company_ids)
        company_filter = f"t.company_id::text IN ('{company_ids_str}')"
        
        product_filter = "1=1"
        if req.p_product_ids and len(req.p_product_ids) > 0:
            product_ids_str = "','".join(req.p_product_ids)
            product_filter = f"t.product_id::text IN ('{product_ids_str}')"

        query = f"""
        SELECT 
            t.product_id,
            t.date,
            t.created_at,
            t.reference_type,
            t.transaction_type,
            t.reference_id,
            COALESCE(
                b.bill_number,
                i.invoice_number,
                cn.credit_note_number,
                cn.cn_number,
                CASE WHEN t.reference_type = 'OPENING_STOCK' THEN 'Opening Balance' ELSE t.reference_id END
            ) as reference_name,
            t.quantity,
            t.cost_price,
            u.name as responsible_name
        FROM docs_inventory_transactions t
        LEFT JOIN docs_users u ON t.created_by_id::text = u.id::text
        LEFT JOIN docs_bills b ON t.reference_type = 'BILL' AND (t.reference_id = b.id::text OR t.reference_id = 'temp-' || b.id::text)
        LEFT JOIN docs_invoices i ON t.reference_type = 'INVOICE' AND (t.reference_id = i.id::text OR t.reference_id = 'temp-' || i.id::text)
        LEFT JOIN docs_credit_notes cn ON t.reference_type = 'CREDIT_NOTE' AND (t.reference_id = cn.id::text OR t.reference_id = 'temp-' || cn.id::text)
        WHERE {company_filter}
          AND {product_filter}
          AND t.date::date >= '{req.p_start_date}'::date
          AND t.date::date <= '{req.p_end_date}'::date
        ORDER BY t.date ASC, t.created_at ASC
        """
        rows = await prisma.query_raw(query)
        
        results = []
        for r in rows:
            results.append({
                "product_id": r["product_id"],
                "date": str(r.get("date", "")),
                "created_at": str(r.get("created_at", "")),
                "reference_type": r.get("reference_type", ""),
                "transaction_type": r.get("transaction_type", ""),
                "reference_id": r.get("reference_id", ""),
                "reference_name": r.get("reference_name") or r.get("reference_id", ""),
                "quantity": float(r.get("quantity") or 0),
                "cost_price": float(r.get("cost_price") or 0),
                "responsible_name": r.get("responsible_name", "")
            })
            
        return results
    except Exception as err:
        logger.error(f"Error fetching inventory ledger: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

