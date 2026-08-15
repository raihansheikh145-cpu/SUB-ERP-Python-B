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
    
    # Get an active loan
    loans = await db.query_raw("SELECT id FROM docs_loans WHERE status = 'ACTIVE' ORDER BY updated_at DESC LIMIT 1")
    if not loans:
        print("No active loans found.")
        await db.disconnect()
        return
        
    loan_id = loans[0]["id"]
    print(f"Testing payment for loan {loan_id}")
    
    try:
        rpc_res = await db.query_raw(
            'SELECT * FROM post_loan_payment_rpc($1::text, $2::int, $3::text, $4::numeric, $5::numeric)',
            loan_id, 1, "2026-08-14", 10.0, 100.0
        )
        print("RPC Result:", rpc_res)
    except Exception as e:
        print("RPC Error:", str(e))
        
    await db.disconnect()

asyncio.run(main())
