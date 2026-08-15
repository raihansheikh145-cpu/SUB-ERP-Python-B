from fastapi import APIRouter, Depends, HTTPException, Request
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["Products"])
logger = logging.getLogger(__name__)


def _get(p: dict, data: dict, *keys, default=None):
    """Check p then data for multiple key variants (camelCase and snake_case)."""
    for key in keys:
        if p.get(key) is not None:
            return p[key]
        if data.get(key) is not None:
            return data[key]
    return default


@router.post("/upsert")
async def upsert_product(req: Request, user=Depends(require_roles(["ADMIN", "INVENTORY_MANAGER", "ACCOUNTANT"]))):
    try:
        body = await req.json()

        is_bulk = "p_products" in body and isinstance(body.get("p_products"), list)
        raw_products = body.get("p_products") if is_bulk else [body.get("p_product")]
        raw_products = [p for p in raw_products if p]

        if not raw_products:
            return {"success": False, "error": "No product data provided"}

        first = raw_products[0]
        first_data = first.get("data") or {}
        company_id = (
            first.get("company_id") or
            (first.get("company_ids") or [None])[0] or
            first_data.get("companyId") or
            (first_data.get("companyIds") or [None])[0]
        )

        if not company_id:
            return {"success": False, "error": "Company ID is required"}

        errors = []
        valid_products = []

        # SKU uniqueness check (flat column)
        skus = []
        for p in raw_products:
            d = p.get("data") or {}
            sku = _get(p, d, "sku")
            if sku:
                skus.append(str(sku))

        existing_by_sku = {}
        if skus:
            rows = await prisma.query_raw(
                "SELECT id, sku FROM docs_products WHERE company_id = $1 AND sku = ANY($2::text[])",
                company_id, skus
            )
            for row in (rows or []):
                existing_by_sku[row.get("sku")] = row.get("id")

        # Cost price lock check
        product_ids = [p.get("id") for p in raw_products if p.get("id")]
        locked_ids = set()
        if product_ids:
            rows = await prisma.query_raw(
                "SELECT DISTINCT product_id FROM docs_inventory_transactions WHERE product_id = ANY($1::text[])",
                product_ids
            )
            for row in (rows or []):
                locked_ids.add(row.get("product_id"))

        for i, p in enumerate(raw_products):
            d = p.get("data") or {}
            sku = _get(p, d, "sku")
            pid = p.get("id")

            if sku and sku in existing_by_sku and existing_by_sku[sku] != pid:
                errors.append({"index": i, "id": pid, "error": f"SKU '{sku}' already exists for this company."})
                continue

            if pid in locked_ids:
                cost_rows = await prisma.query_raw(
                    "SELECT cost_price FROM docs_products WHERE id = $1", pid
                )
                existing_cost = float((cost_rows or [{}])[0].get("cost_price") or 0)
                new_cost = _get(p, d, "costPrice", "cost_price")
                if new_cost is not None and float(new_cost) != existing_cost:
                    errors.append({"index": i, "id": pid, "error": "Cannot modify Cost Price — product has inventory transactions."})
                    continue

            valid_products.append(p)

        if not valid_products:
            print(f"All products failed validation. Errors: {errors}")
            return {"success": False, "message": "All products failed validation", "errors": errors}

        print(f"Proceeding to upsert {len(valid_products)} valid products")
        upserted_data = []
        async with prisma.tx() as tx:
            for p in valid_products:
                d = p.get("data") or {}

                pid              = p.get("id")
                cid              = p.get("company_id") or company_id
                company_ids      = p.get("company_ids") or d.get("companyIds") or [cid]
                ptype            = _get(p, d, "type", default="PRODUCT")
                name             = _get(p, d, "name", default="")
                sku              = _get(p, d, "sku")
                price            = float(_get(p, d, "price", default=0) or 0)
                cost_price       = float(_get(p, d, "costPrice", "cost_price", default=0) or 0)
                uom              = _get(p, d, "uom", default="Pcs")
                brand            = _get(p, d, "brand")
                category         = _get(p, d, "category", default="All")
                description      = _get(p, d, "description", default="")
                tracking_type    = _get(p, d, "trackingType", "tracking_type", default="NONE")
                inv_policy       = _get(p, d, "invoicingPolicy", "invoicing_policy", default="Ordered quantities")
                initial_cost     = float(_get(p, d, "initialCost", "initial_cost", default=cost_price) or cost_price)
                lpp              = float(_get(p, d, "lastPurchasePrice", "lastPurchaseRate", "last_purchase_price", default=0) or 0)
                qoh              = float(_get(p, d, "quantityOnHand", "quantity_on_hand", default=0) or 0)
                is_in_pos        = bool(_get(p, d, "isInPos", "is_in_pos", default=True))
                can_be_sold      = bool(_get(p, d, "canBeSold", "can_be_sold", default=True))
                can_be_purchased = bool(_get(p, d, "canBePurchased", "can_be_purchased", default=True))
                can_be_expensed  = bool(_get(p, d, "canBeExpensed", "can_be_expensed", default=False))
                track_inventory  = bool(_get(p, d, "trackInventory", "track_inventory", default=True))
                external_id      = _get(p, d, "externalId", "external_id")
                tax_code         = _get(p, d, "taxCode", "tax_code")
                serials          = _get(p, d, "serialNumbers", "serial_numbers", default=[])
                if not isinstance(serials, list):
                    serials = []

                # Merge data JSONB
                data_json = json.dumps({
                    **d,
                    "name": name, "sku": sku, "price": price, "costPrice": cost_price,
                    "category": category, "brand": brand, "uom": uom, "type": ptype,
                    "companyId": cid, "companyIds": company_ids,
                })

                res = await tx.query_raw(
                    """
                    INSERT INTO docs_products (
                        id, company_id, company_ids, type,
                        name, sku, price, cost_price, uom, brand, category,
                        description, tracking_type, invoicing_policy,
                        initial_cost, last_purchase_rate, last_purchase_price,
                        quantity_on_hand, is_in_pos, can_be_sold, can_be_purchased,
                        can_be_expensed, track_inventory, external_id, tax_code,
                        serial_numbers, updated_at
                    ) VALUES (
                        $1, $2, $3::text[], $4,
                        $5, $6, $7, $8, $9, $10, $11,
                        $12, $13, $14,
                        $15, $16, $16,
                        $17, $18, $19, $20,
                        $21, $22, $23, $24,
                        $25::jsonb, now()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        company_id        = EXCLUDED.company_id,
                        company_ids       = EXCLUDED.company_ids,
                        type              = EXCLUDED.type,
                        name              = EXCLUDED.name,
                        sku               = COALESCE(EXCLUDED.sku, docs_products.sku),
                        price             = EXCLUDED.price,
                        cost_price        = CASE WHEN docs_products.id = ANY($26::text[])
                                                 THEN docs_products.cost_price
                                                 ELSE EXCLUDED.cost_price END,
                        uom               = EXCLUDED.uom,
                        brand             = EXCLUDED.brand,
                        category          = EXCLUDED.category,
                        description       = EXCLUDED.description,
                        tracking_type     = EXCLUDED.tracking_type,
                        invoicing_policy  = EXCLUDED.invoicing_policy,
                        initial_cost      = EXCLUDED.initial_cost,
                        last_purchase_rate  = EXCLUDED.last_purchase_rate,
                        last_purchase_price = EXCLUDED.last_purchase_price,
                        quantity_on_hand  = EXCLUDED.quantity_on_hand,
                        is_in_pos         = EXCLUDED.is_in_pos,
                        can_be_sold       = EXCLUDED.can_be_sold,
                        can_be_purchased  = EXCLUDED.can_be_purchased,
                        can_be_expensed   = EXCLUDED.can_be_expensed,
                        track_inventory   = EXCLUDED.track_inventory,
                        external_id       = EXCLUDED.external_id,
                        tax_code          = EXCLUDED.tax_code,
                        serial_numbers    = EXCLUDED.serial_numbers,
                        updated_at        = now()
                    RETURNING id, name, sku, company_id
                    """,
                    pid, cid, company_ids, ptype,
                    name, sku, price, cost_price, uom, brand, category,
                    description, tracking_type, inv_policy,
                    initial_cost, lpp,
                    qoh, is_in_pos, can_be_sold, can_be_purchased,
                    can_be_expensed, track_inventory, external_id, tax_code,
                    json.dumps(serials),
                    list(locked_ids),
                )
                if res:
                    upserted_data.append(res[0])
                    print(f"Upserted product '{res[0].get('name')}' id={pid}")

        return {
            "success": True,
            "upsertedCount": len(valid_products),
            "errors": errors if errors else None,
            "data": upserted_data,
        }

    except Exception as err:
        import traceback
        traceback.print_exc()
        print(f"Product upsert failed: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/bulk-upsert")
async def bulk_upsert_products(req: Request, user=Depends(require_roles(["ADMIN", "INVENTORY_MANAGER", "ACCOUNTANT"]))):
    """Bulk upsert — accepts { p_products: [...] }."""
    body = await req.json()
    products = body.get("p_products", [])
    if not products:
        return {"success": False, "error": "No products provided"}

    class _Req:
        async def json(self):
            return {"p_products": products}

    return await upsert_product(_Req(), user)

