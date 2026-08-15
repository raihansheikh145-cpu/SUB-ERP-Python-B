import asyncio
from app.core.db import prisma
from app.services.accounting_service import AccountingService

async def main():
    await prisma.connect()
    
    # Find all payments that are POSTED but have no corresponding journal entry
    # (AccountingService.post_payment creates a journal and updates the payment's data field to include journalEntryId, but let's just check if journal exists)
    
    payments = await prisma.query_raw("""
        SELECT p.id, p.company_id
        FROM docs_payments p
        LEFT JOIN docs_journals j ON j.id = 'JE-' || REPLACE(UPPER(p.id), 'PAY-', '')
        WHERE p.status = 'POSTED' AND j.id IS NULL
    """)
    
    print(f"Found {len(payments)} posted payments with missing journals.")
    
    for p in payments:
        print(f"Posting missing journal for payment {p['id']}...")
        try:
            await AccountingService.post_payment(prisma, p['id'], p['company_id'])
            print(f"Successfully posted {p['id']}")
        except Exception as e:
            print(f"Error posting {p['id']}: {e}")
            
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
