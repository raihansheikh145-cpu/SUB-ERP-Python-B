import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    res = await db.query_raw("SELECT id, company_id FROM docs_loans")
    print(f"Total loans: {len(res)}")
    for r in res:
        print(r)
    await db.disconnect()

asyncio.run(main())
