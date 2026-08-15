import asyncio
import os
from dotenv import load_dotenv
from app.core.db import prisma

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

async def test():
    await prisma.connect()
    try:
        await prisma.execute_raw('DROP TRIGGER IF EXISTS calc_doc_totals ON docs_invoices')
        await prisma.execute_raw('DROP TRIGGER IF EXISTS calc_doc_totals_bills ON docs_bills')
        await prisma.execute_raw('DROP TRIGGER IF EXISTS calc_doc_totals_credit_notes ON docs_credit_notes')
        print("Triggers dropped")
    except Exception as e:
        print(e)
    finally:
        await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(test())
