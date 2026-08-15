import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    
    try:
        user = await db.authuser.find_first()
        print("User:", user)
    except Exception as e:
        print("Error:", type(e), e)
    
    await db.disconnect()

asyncio.run(main())
