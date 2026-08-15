import asyncio
from app.core.db import prisma

async def test():
    await prisma.connect()
    rows = await prisma.query_raw('SELECT * FROM docs_companies')
    print(rows)
    await prisma.disconnect()

asyncio.run(test())
