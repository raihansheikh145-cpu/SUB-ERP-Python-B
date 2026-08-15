import asyncio
from prisma import Prisma
import os

os.environ['DATABASE_URL'] = "postgresql://postgres:123456@localhost:5432/sub_erp"

async def main():
    db = Prisma()
    await db.connect()
    users = await db.docsuser.find_many()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, companyIds: {u.companyIds}")
    await db.disconnect()

asyncio.run(main())
