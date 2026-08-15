import re

with open("backend/app/api/routers/docs.py", "r") as f:
    content = f.read()

# We need to replace the corrupted upsert_doc with the full version.
# The corrupted one starts at `@router.post("/upsert-doc")` and goes up to `@router.delete("/delete-doc")` (exclusive)

upsert_doc_code = """@router.post("/upsert-doc")
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
        payload.pop("created_at", None)
        payload.pop("updated_at", None)
        payload.pop("createdAt", None)
        payload.pop("updatedAt", None)

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

        query = f\"\"\"
            INSERT INTO {table} (id, {col_list}, updated_at)
            VALUES ($1, {placeholder_list}, NOW())
            ON CONFLICT (id) DO UPDATE SET {update_set}, updated_at = NOW()
        \"\"\"
        values = [doc_id] + [safe_payload[k] for k in col_names]
        await prisma.execute_raw(query, *values)

        return {"success": True, "id": doc_id}
    except Exception as err:
        logger.error(f"upsert_doc error: {err}")
        raise HTTPException(status_code=500, detail=str(err))


"""

pattern = r'@router\.post\("/upsert-doc"\).*?(?=@router\.delete\("/delete-doc"\))'
new_content = re.sub(pattern, upsert_doc_code, content, flags=re.DOTALL)

with open("backend/app/api/routers/docs.py", "w") as f:
    f.write(new_content)

print("Restored upsert_doc.")
