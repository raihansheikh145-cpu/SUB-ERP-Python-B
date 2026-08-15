import asyncio
from app.core.db import prisma

async def fix_nulls():
    await prisma.connect()
    try:
        tables = [
            'docs_accounts', 'docs_invoices', 'docs_bills', 'docs_payments', 
            'docs_journals', 'docs_credit_notes', 'docs_inventory_transactions', 
            'docs_inventory_adjustments', 'docs_products', 'docs_contacts'
        ]
        for t in tables:
            try:
                await prisma.execute_raw(f"UPDATE {t} SET updated_at = NOW() WHERE updated_at IS NULL")
                print(f"Fixed {t}")
            except Exception as e:
                print(f"Error fixing {t}:", e)
    finally:
        await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(fix_nulls())
