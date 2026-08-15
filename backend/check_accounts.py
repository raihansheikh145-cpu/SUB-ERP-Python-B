import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    accounts = await db.query_raw("SELECT DISTINCT code, name, type FROM docs_accounts WHERE code IN ('210100', '100601', '500208', '400200')")
    for a in accounts:
        print(a)
    await db.disconnect()

asyncio.run(main())
