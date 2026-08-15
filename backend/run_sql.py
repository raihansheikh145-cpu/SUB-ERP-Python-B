import asyncio
from prisma import Prisma

async def main():
    p = Prisma()
    await p.connect()
    with open('backend/database/drop_bill_triggers.sql', 'r') as f:
        sql = f.read()
    await p.execute_raw(sql)
    await p.disconnect()
    print('Done!')

asyncio.run(main())
