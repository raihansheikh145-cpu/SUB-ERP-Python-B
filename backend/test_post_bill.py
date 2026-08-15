import asyncio
from app.core.db import prisma
from app.services.accounting_service import AccountingService

async def main():
    await prisma.connect()
    # Get the latest bill ID
    bill = await prisma.query_raw("SELECT id FROM docs_bills ORDER BY updated_at DESC LIMIT 1")
    if bill:
        bill_id = bill[0]['id']
        print(f"Posting bill: {bill_id}")
        try:
            res = await AccountingService.post_bill(prisma, bill_id)
            print("Success!", res)
        except Exception as e:
            print("Error:", e)
            import traceback
            traceback.print_exc()
    else:
        print("No bills found")
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
