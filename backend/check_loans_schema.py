import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    res = await db.query_raw("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'docs_loans'")
    for r in res:
        print(r)
    await db.disconnect()

asyncio.run(main())
