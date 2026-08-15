import asyncio
from prisma import Prisma
import os

os.environ['DATABASE_URL'] = "postgresql://postgres:123456@localhost:5432/sub_erp"

async def main():
    db = Prisma()
    await db.connect()
    journals = await db.docsjournal.find_many()
    print("Unique created_by_ids:")
    print(set([j.created_by_id for j in journals]))
    await db.disconnect()

asyncio.run(main())
