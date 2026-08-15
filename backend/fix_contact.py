import asyncio
from prisma import Prisma
import os

async def main():
    with open("../.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip().strip("\"").strip("'")
    db = Prisma()
    await db.connect()
    loans = await db.query_raw("SELECT id, contact_id FROM docs_loans WHERE contact_id LIKE 'f75e1e%'")
    print("Loans:", loans)
    if loans:
        full_id = loans[0]["contact_id"]
        await db.query_raw("""
        INSERT INTO docs_contacts (id, company_id, name, type, email) 
        VALUES ($1, 'd9dbb775-6839-4201-9dda-caa39e271201', 'Missing Partner (Recovered)', 'LENDER', '')
        ON CONFLICT DO NOTHING
        """, full_id)
        print(f"Inserted dummy contact for {full_id}")
    await db.disconnect()
asyncio.run(main())
