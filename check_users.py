import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    users = await db.authuser.find_many()
    for u in users:
        print(f"Email: {u.email}, Active: {u.isActive}")
    await db.disconnect()

asyncio.run(main())
