import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    users = await db.docsuser.find_many(order={"createdAt": "desc"}, take=5)
    for u in users:
        print(f"DocsUser ID: {u.id}, Email: {u.email}, UserUUID: {u.userUuid}")
    
    auth_users = await db.authuser.find_many(order={"createdAt": "desc"}, take=5)
    for au in auth_users:
        print(f"AuthUser ID: {au.id}, Email: {au.email}")
    await db.disconnect()

asyncio.run(main())
