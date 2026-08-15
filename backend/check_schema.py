import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    res = await prisma.query_raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'docs_payments'")
    for row in res:
        print(row["column_name"], row["data_type"])
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
