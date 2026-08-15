import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    try:
        tables = await prisma.query_raw("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        for t in tables:
            print(t['table_name'])
    finally:
        await prisma.disconnect()

asyncio.run(main())
