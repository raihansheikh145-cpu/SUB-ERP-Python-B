import asyncio
import json
from app.core.db import prisma

async def main():
    await prisma.connect()
    accounts = await prisma.query_raw("SELECT id, code, company_id FROM docs_accounts WHERE company_id = 'd9dbb775-6839-4201-9dda-caa39e271201'")
    for a in accounts:
        print(a)
    await prisma.disconnect()

asyncio.run(main())
