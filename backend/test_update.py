import asyncio
from prisma import Prisma
import os, json

async def main():
    with open("../.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip().strip("\"").strip("'")
    db = Prisma()
    await db.connect()
    
    contact_id = "f75e1ef5-9d72-430a-badc-f0ac50b9cc11"
    new_name = "Missing Partner (Recovered) FIXED TEST"
    
    await db.execute_raw("""
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
    """, contact_id, "d9dbb775-6839-4201-9dda-caa39e271201", new_name, "LENDER", None, None, None, [], "{}", False, False, True)
    
    c = await db.query_raw("SELECT id, name FROM docs_contacts WHERE id = $1", contact_id)
    print("Contacts after raw update:", c)
    await db.disconnect()

asyncio.run(main())
