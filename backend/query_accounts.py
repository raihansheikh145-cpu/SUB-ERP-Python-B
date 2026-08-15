import asyncio
import os
from dotenv import load_dotenv
from app.core.db import prisma

load_dotenv()

async def main():
    await prisma.connect()
    accounts = await prisma.query_raw("SELECT code, name FROM docs_accounts WHERE code LIKE '40010%'")
    for acc in accounts:
        print(f"{acc['code']} - {acc['name']}")
    await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
