import asyncio
from prisma import Prisma
import sys

async def main():
    db = Prisma()
    await db.connect()
    res = await db.query_raw("SELECT id, journal_entry_id FROM docs_loans ORDER BY updated_at DESC LIMIT 5")
    for r in res:
        print(f"Loan: {r['id']}, Journal: {r['journal_entry_id']}")
    await db.disconnect()

asyncio.run(main())
