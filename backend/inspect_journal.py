import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    lines = await prisma.query_raw("SELECT id, account_id, company_id, description FROM docs_journal_lines WHERE journal_id ILIKE '%f6015fb5%'")
    print("JOURNAL LINES:", lines)
    accounts = await prisma.query_raw("SELECT id, code, name, company_id, data FROM docs_accounts LIMIT 20")
    print("SOME ACCOUNTS:", accounts)
    await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
