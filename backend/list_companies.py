import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    try:
        companies = await prisma.query_raw("""
            SELECT id, name FROM docs_companies
        """)
        print(companies)
    finally:
        await prisma.disconnect()

asyncio.run(main())
