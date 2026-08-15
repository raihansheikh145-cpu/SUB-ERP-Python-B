from fastapi import APIRouter, Depends, HTTPException, Request, Query
import logging
import json
from typing import Optional, List
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["Generic Docs"])
logger = logging.getLogger(__name__)

# Whitelisted tables that can be fetched via the generic docs endpoint
ALLOWED_TABLES = [
    "docs_invoices", "docs_bills", "docs_journals", "docs_journal_lines",
    "docs_payments", "docs_products", "docs_contacts", "docs_users",
    "docs_credit_notes", "docs_loans", "docs_inventory_transactions",
    "docs_inventory_adjustments", "docs_inventory_ledger",
    "docs_invoice_lines", "docs_bill_lines", "docs_credit_note_lines",
    "docs_attendance", "docs_payslips", "docs_roles", "docs_tasks",
    "docs_commission_targets", "docs_holidays", "docs_advance_salaries",
    "docs_brands", "docs_categories", "docs_fiscal_periods",
    "docs_warehouses", "docs_leaves",
]

TABLE_SORT = {
    "docs_invoices": "invoice_number",
    "docs_bills": "bill_number",
    "docs_payments": "payment_number",
    "docs_journals": "reference_number",
    "docs_credit_notes": "credit_note_number",
    "docs_products": "updated_at",
    "docs_contacts": "updated_at",
    "docs_loans": "updated_at",
}

@router.get("")
async def get_docs(
    table: str = Query(..., description="The table to fetch from"),
    company_ids: Optional[str] = Query(None, description="Comma-separated company IDs"),
    limit: Optional[int] = Query(None, description="Limit rows"),
    offset: Optional[int] = Query(0, description="Offset rows"),
    search: Optional[str] = Query(None, description="Search term"),
    status: Optional[str] = Query(None, description="Filter by status"),
    parent_ids: Optional[str] = Query(None, description="Comma-separated parent document IDs for line-item tables"),
    user=Depends(get_current_user)
):
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=403, detail=f"Access to table '{table}' is not permitted.")

    try:
        conditions = ["1=1"]
        params = []
        param_idx = 1

        if company_ids:
            ids = [cid.strip() for cid in company_ids.split(",") if cid.strip()]
            if ids:
                placeholders = ",".join([f"${param_idx + i}" for i in range(len(ids))])
                conditions.append(f"(company_id IN ({placeholders}) OR company_id IS NULL)")
                params.extend(ids)
                param_idx += len(ids)

        if status:
            conditions.append(f"status = ${param_idx}")
            params.append(status)
            param_idx += 1

        # parent_ids filter for line-item tables (journal_lines, invoice_lines, etc.)
        PARENT_FK_MAP = {
            "docs_journal_lines": "journal_id",
            "docs_invoice_lines": "invoice_id",
            "docs_bill_lines": "bill_id",
            "docs_credit_note_lines": "credit_note_id",
        }
        if parent_ids and table in PARENT_FK_MAP:
            fk_col = PARENT_FK_MAP[table]
            pids = [pid.strip() for pid in parent_ids.split(",") if pid.strip()]
            if pids:
                placeholders = ",".join([f"${param_idx + i}" for i in range(len(pids))])
                conditions.append(f"{fk_col} IN ({placeholders})")
                params.extend(pids)
                param_idx += len(pids)

        where_clause = " AND ".join(conditions)
        sort_col = TABLE_SORT.get(table, "id")
        
        # Check if sort column exists (fallback to id)
        try:
            count_query = f"SELECT COUNT(*) as cnt FROM {table} WHERE {where_clause}"
            count_res = await prisma.query_raw(count_query, *params) if params else await prisma.query_raw(count_query)
            total_count = count_res[0].get("cnt", 0) if count_res else 0
        except Exception:
            total_count = 0

        # Build main query
        query = f"SELECT * FROM {table} WHERE {where_clause} ORDER BY {sort_col} DESC NULLS LAST"
        
        # Security: Enforce limits to prevent memory bloat
        final_limit = min(limit, 1000) if limit else 200
        
        query += f" LIMIT ${param_idx} OFFSET ${param_idx + 1}"
        params.extend([final_limit, offset or 0])

        data = await prisma.query_raw(query, *params) if params else await prisma.query_raw(query)

        return {"success": True, "data": data or [], "count": total_count}

    except Exception as err:
        logger.error(f"get_docs error for table {table}: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.get("/single")
async def get_single_doc(
    table: str = Query(...),
    id: str = Query(...),
    user=Depends(get_current_user)
):
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=403, detail=f"Access to table '{table}' is not permitted.")

    try:
        data = await prisma.query_raw(f"SELECT * FROM {table} WHERE id = $1 LIMIT 1", id)
        if not data:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"success": True, "data": data[0]}
    except Exception as err:
        logger.error(f"get_single_doc error for {table}/{id}: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/upsert-doc")
async def upsert_doc(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        table = body.get("table")
        payload = body.get("payload")
        doc_id = body.get("id")

        if not table or not payload or not doc_id:
            return {"success": False, "error": "table, id, and payload are required"}

        if table not in ALLOWED_TABLES:
            logger.warning(f"Unauthorized upsert to table: {table}")
            return {"success": False, "error": f"Upserts to '{table}' are not permitted via this endpoint."}

        # Sanitize timestamps — backend controls these
        payload = dict(body.get("payload", {}))
        payload.pop("id", None)
        payload.pop("createdAt", None)
        payload.pop("updatedAt", None)
        
        # Convert all keys from camelCase to snake_case
        import re
        def camel_to_snake(name):
            name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
            return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
            
        mapped_payload = {}
        for k, v in payload.items():
            mapped_payload[camel_to_snake(k)] = v
        payload = mapped_payload

        # Get the actual columns this table has in the DB
        cols_res = await prisma.query_raw(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
            table
        )
        db_columns = {row["column_name"]: row["data_type"] for row in cols_res}

        # Only include payload keys that actually exist as columns and are safe
        safe_payload = {
            k: v for k, v in payload.items()
            if k.replace("_", "").isalnum() and k in db_columns and k != "id"
        }

        if not safe_payload:
            # Nothing to update but id exists — this is a no-op
            logger.info(f"upsert_doc: no matching columns for table {table}, skipping")
            return {"success": True, "id": doc_id}

        # Build dynamic INSERT ... ON CONFLICT DO UPDATE
        col_names = list(safe_payload.keys())
        col_list = ", ".join(col_names)
        
        placeholders = []
        for i, col in enumerate(col_names):
            dtype = db_columns[col].lower()
            if dtype == 'date':
                placeholders.append(f"${i+2}::date")
            elif dtype.startswith('timestamp'):
                placeholders.append(f"${i+2}::timestamp")
            elif dtype in ('numeric', 'decimal'):
                placeholders.append(f"${i+2}::numeric")
            elif dtype == 'boolean':
                placeholders.append(f"${i+2}::boolean")
            elif dtype == 'jsonb':
                placeholders.append(f"${i+2}::jsonb")
                val = safe_payload[col]
                if isinstance(val, (dict, list)):
                    import json
                    safe_payload[col] = json.dumps(val)
            else:
                placeholders.append(f"${i+2}")
                
        placeholder_list = ", ".join(placeholders)
        update_set = ", ".join([f"{col} = EXCLUDED.{col}" for col in col_names])

        query = f"""
            INSERT INTO {table} (id, {col_list}, updated_at)
            VALUES ($1, {placeholder_list}, NOW())
            ON CONFLICT (id) DO UPDATE SET {update_set}, updated_at = NOW()
        """
        values = [doc_id] + [safe_payload[k] for k in col_names]
        await prisma.execute_raw(query, *values)

        return {"success": True, "id": doc_id}
    except Exception as err:
        logger.error(f"upsert_doc error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.delete("/delete-doc")
async def delete_doc(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        table = body.get("table")
        ids = body.get("ids", [])

        if not table or not ids:
            return {"success": False, "error": "table and ids are required"}

        if table not in ALLOWED_TABLES:
            return {"success": False, "error": f"Deletes on '{table}' are not permitted via this endpoint."}

        # Validate UUIDs to prevent SQL injection
        import re
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', re.IGNORECASE)
        valid_ids = [id for id in ids if uuid_pattern.match(str(id))]

        if not valid_ids:
            return {"success": False, "error": "No valid UUIDs provided"}

        placeholders = ",".join([f"${i + 1}" for i in range(len(valid_ids))])
        await prisma.execute_raw(f"DELETE FROM {table} WHERE id IN ({placeholders})", *valid_ids)

        return {"success": True, "deleted": len(valid_ids)}
    except Exception as err:
        logger.error(f"delete_doc error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.get("/account-balances")
async def get_account_balances(
    company_ids: Optional[str] = Query(None),
    as_of_date: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    try:
        ids = [cid.strip() for cid in company_ids.split(",") if cid.strip()] if company_ids else []
        today = as_of_date or __import__("datetime").date.today().isoformat()

        query = """
            SELECT 
                jl.account_id,
                SUM(jl.debit) - SUM(jl.credit) AS balance
            FROM docs_journal_lines jl
            JOIN docs_journals j ON j.id = jl.journal_id
            WHERE j.status = 'POSTED'
            AND j.date <= $1::date
        """
        params = [today]
        if ids:
            placeholders = ",".join([f"${i + 2}" for i in range(len(ids))])
            query += f" AND j.company_id IN ({placeholders})"
            params.extend(ids)

        query += " GROUP BY jl.account_id"

        data = await prisma.query_raw(query, *params)
        balances = {row["account_id"]: float(row["balance"] or 0) for row in (data or [])}

        return {"success": True, "data": balances}
    except Exception as err:
        logger.error(f"get_account_balances error: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/partner-balances")
async def get_partner_balances(
    company_ids: Optional[str] = Query(None),
    as_of_date: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    try:
        ids = [cid.strip() for cid in company_ids.split(",") if cid.strip()] if company_ids else []
        today = as_of_date or __import__("datetime").date.today().isoformat()

        query = """
            SELECT 
                jl.contact_id as partner_id,
                SUM(jl.debit) - SUM(jl.credit) AS balance
            FROM docs_journal_lines jl
            JOIN docs_journals j ON j.id = jl.journal_id
            WHERE j.status = 'POSTED'
            AND j.date <= $1::date
            AND jl.contact_id IS NOT NULL
        """
        params = [today]
        if ids:
            placeholders = ",".join([f"${i + 2}" for i in range(len(ids))])
            query += f" AND j.company_id IN ({placeholders})"
            params.extend(ids)

        query += " GROUP BY jl.contact_id"

        data = await prisma.query_raw(query, *params)
        balances = {row["partner_id"]: float(row["balance"] or 0) for row in (data or [])}

        return {"success": True, "data": balances}
    except Exception as err:
        logger.error(f"get_partner_balances error: {err}")
        raise HTTPException(status_code=500, detail=str(err))
