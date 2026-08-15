import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    lines = await prisma.query_raw("SELECT id, account_id, debit, credit FROM docs_journal_lines WHERE journal_id = 'JE-EEF2426B-D540-4A5F-BB5A-6EF29FC3C3F8'")
    for l in lines:
        print(l)
    await prisma.disconnect()

asyncio.run(main())
