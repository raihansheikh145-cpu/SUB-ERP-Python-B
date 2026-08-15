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
    c = await db.query_raw("SELECT loan_number, amount, amortization_schedule FROM docs_loans ORDER BY updated_at DESC LIMIT 1")
    print("Loans:", c)
    await db.disconnect()
asyncio.run(main())
