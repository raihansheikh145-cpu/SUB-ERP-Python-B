import asyncio
import os
from dotenv import load_dotenv
from app.core.db import prisma

load_dotenv()

async def main():
    await prisma.connect()
    users = await prisma.authuser.find_many()
    for u in users:
        print(f"Email: {u.email}, Role: {u.role}, Active: {u.isActive}")
    await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
