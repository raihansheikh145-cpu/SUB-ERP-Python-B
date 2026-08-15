import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    res = await prisma.query_raw("SELECT id, amount, data->>'applied_bills' as applied, contact_id FROM docs_payments WHERE type='PAYMENT' ORDER BY updated_at DESC LIMIT 5")
    for r in res:
        print(r)
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
