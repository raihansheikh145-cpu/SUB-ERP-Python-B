import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    res = await db.query_raw("""
        SELECT trigger_name, event_object_table, action_statement 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    """)
    for r in res:
        print(f"{r['trigger_name']} ON {r['event_object_table']}")
    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
