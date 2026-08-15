
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
        company_filter = f"t.company_id IN ('{company_ids_str}')"
        
        product_filter = "1=1"
        if req.p_product_ids and len(req.p_product_ids) > 0:
            product_ids_str = "','".join(req.p_product_ids)
            product_filter = f"t.product_id IN ('{product_ids_str}')"

        query = f"""
        SELECT 
            t.product_id,
            t.date,
            t.created_at,
            t.reference_type,
            t.transaction_type,
            t.reference_id,
            t.quantity,
            t.cost_price,
            u.name as responsible_name
        FROM docs_inventory_transactions t
        LEFT JOIN docs_users u ON t.created_by_id = u.id
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
                "quantity": float(r.get("quantity") or 0),
                "cost_price": float(r.get("cost_price") or 0),
                "responsible_name": r.get("responsible_name", "")
            })
            
        return results
    except Exception as err:
        logger.error(f"Error fetching inventory ledger: {err}")
        raise HTTPException(status_code=500, detail="Internal server error")

