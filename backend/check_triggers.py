import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    res = await db.query_raw("""
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'docs_loans'
    """)
    print([r['trigger_name'] for r in res])
    await db.disconnect()

asyncio.run(main())
