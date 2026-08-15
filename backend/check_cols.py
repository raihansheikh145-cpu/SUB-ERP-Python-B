import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    cols = await db.query_raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'docs_loans'")
    print([c['column_name'] for c in cols])
    await db.disconnect()

asyncio.run(main())
