from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Any, Dict, List, Optional
import logging
import json
from app.core.db import prisma
from app.core.security import get_current_user, require_roles

router = APIRouter(tags=["Contacts"])
logger = logging.getLogger(__name__)

@router.post("/upsert")
async def upsert_contact(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    try:
        body = await req.json()
        
        is_bulk = "p_contacts" in body and isinstance(body["p_contacts"], list)
        raw_contacts = body.get("p_contacts") if is_bulk else [body.get("p_contact")]

        if not raw_contacts or len(raw_contacts) == 0 or raw_contacts[0] is None:
            return {"success": False, "error": "No contact data provided"}

        first_contact = raw_contacts[0]
        company_id = first_contact.get("company_id")
        if not company_id and first_contact.get("company_ids"):
            company_id = first_contact["company_ids"][0]

        if not company_id:
            return {"success": False, "error": "Company ID is required"}

        errors = []
        valid_contacts_to_upsert = []

        # 1. Fetch Existing Contacts to check for Email/Tax ID Duplicates
        emails = []
        tax_ids = []
        for c in raw_contacts:
            data_dict = c.get("data", {})
            email = data_dict.get("email") or c.get("email")
            tax_id = data_dict.get("tax_id") or c.get("tax_id")
            if email: emails.append(email)
            if tax_id: tax_ids.append(tax_id)

        existing_contacts = []
        if len(emails) > 0 or len(tax_ids) > 0:
            existing = await prisma.docscontact.find_many(
                where={"company_id": company_id}
            )
            # Serialize for easy loop logic
            existing_contacts = [{"id": ec.id, "data": ec.data and json.loads(ec.data) if isinstance(ec.data, str) else ec.data} for ec in existing]

        # Validate each contact
        for i, c in enumerate(raw_contacts):
            data_dict = c.get("data", {})
            email = data_dict.get("email") or c.get("email")
            tax_id = data_dict.get("tax_id") or c.get("tax_id")
            
            is_duplicate = False
            for ec in existing_contacts:
                if ec["id"] == c.get("id"):
                    continue # Skip self update
                
                ec_data = ec.get("data") or {}
                ec_email = ec_data.get("email") or ec.get("email")
                ec_tax_id = ec_data.get("tax_id") or ec.get("tax_id")

                if email and ec_email and str(ec_email).lower() == str(email).lower():
                    errors.append({"index": i, "id": c.get("id"), "error": f"Contact with email '{email}' already exists."})
                    is_duplicate = True
                    break
                    
                if tax_id and ec_tax_id and str(ec_tax_id) == str(tax_id):
                    errors.append({"index": i, "id": c.get("id"), "error": f"Contact with Tax ID '{tax_id}' already exists."})
                    is_duplicate = True
                    break
                    
            if is_duplicate:
                continue
                
            valid_contacts_to_upsert.append(c)

        if len(valid_contacts_to_upsert) == 0:
            err_msg = "; ".join([e.get("error", "") for e in errors if e.get("error")]) or "All contacts failed validation"
            return {"success": False, "message": err_msg, "errors": errors}

        # Execute Bulk Upsert
        # Since Prisma python doesn't have a direct upsertMany with multiple different payloads easily, 
        # we do it iteratively inside a transaction or via raw sql
        async with prisma.tx() as transaction:
            for contact in valid_contacts_to_upsert:
                # We need to construct the upsert
                c_id = contact.get("id")
                c_name = contact.get("name")
                c_type = contact.get("type")
                c_company_id = contact.get("company_id")
                
                c_email = contact.get("email") or (contact.get("data") or {}).get("email")
                c_phone = contact.get("phone") or (contact.get("data") or {}).get("phone")
                c_address = contact.get("address") or (contact.get("data") or {}).get("address")
                c_company_ids = contact.get("company_ids") or (contact.get("data") or {}).get("companyIds") or []
                c_opening_balances = contact.get("opening_balances") or (contact.get("data") or {}).get("openingBalances") or {}
                
                is_customer = contact.get("is_customer", False)
                is_vendor = contact.get("is_vendor", False)
                is_lender = contact.get("is_lender", False)
                
                # Match Supabase admin upsert semantics: if not given, it relies on defaults or just inserts
                await transaction.execute_raw(
                    '''
                    INSERT INTO docs_contacts (id, company_id, name, type, email, phone, address, company_ids, opening_balances, is_customer, is_vendor, is_lender, updated_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, now()) 
                    ON CONFLICT (id) DO UPDATE SET 
                        company_id = COALESCE(EXCLUDED.company_id, docs_contacts.company_id),
                        name = COALESCE(EXCLUDED.name, docs_contacts.name),
                        type = COALESCE(EXCLUDED.type, docs_contacts.type),
                        email = COALESCE(EXCLUDED.email, docs_contacts.email),
                        phone = COALESCE(EXCLUDED.phone, docs_contacts.phone),
                        address = COALESCE(EXCLUDED.address, docs_contacts.address),
                        company_ids = COALESCE(EXCLUDED.company_ids, docs_contacts.company_ids),
                        opening_balances = COALESCE(EXCLUDED.opening_balances, docs_contacts.opening_balances),
                        is_customer = COALESCE(EXCLUDED.is_customer, docs_contacts.is_customer),
                        is_vendor = COALESCE(EXCLUDED.is_vendor, docs_contacts.is_vendor),
                        is_lender = COALESCE(EXCLUDED.is_lender, docs_contacts.is_lender),
                        updated_at = now()
                    ''',
                    c_id,
                    c_company_id,
                    c_name,
                    c_type,
                    c_email,
                    c_phone,
                    c_address,
                    c_company_ids,
                    json.dumps(c_opening_balances),
                    is_customer,
                    is_vendor,
                    is_lender
                )

        logger.info(f"Successfully upserted {len(valid_contacts_to_upsert)} contacts.")

        res = {
            "success": True,
            "upsertedCount": len(valid_contacts_to_upsert),
            "data": valid_contacts_to_upsert # Send back the valid ones
        }
        if len(errors) > 0:
            res["errors"] = errors
            
        return res

    except Exception as err:
        logger.error(f"Failed to process contact upsert: {err}")
        raise HTTPException(status_code=500, detail=str(err))


@router.post("/bulk-upsert")
async def bulk_upsert_contacts(req: Request, user=Depends(require_roles(["ADMIN", "ACCOUNTANT"]))):
    """
    Bulk upsert endpoint — accepts { p_contacts: [...] }.
    Delegates to the same /upsert logic which already handles p_contacts arrays.
    """
    body = await req.json()
    contacts = body.get("p_contacts", [])
    if not contacts:
        return {"success": False, "error": "No contacts provided"}

    class _SyntheticReq:
        async def json(self):
            return {"p_contacts": contacts}

    return await upsert_contact(_SyntheticReq(), user)

