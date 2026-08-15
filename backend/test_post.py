import asyncio
import os
import uuid
import json

from dotenv import load_dotenv
load_dotenv('.env')

from prisma import Prisma
from app.services.accounting_service import AccountingService

async def main():
    p = Prisma()
    await p.connect()
    
    # get a draft invoice
    invs = await p.query_raw("SELECT * FROM docs_invoices WHERE status = 'DRAFT' ORDER BY updated_at DESC LIMIT 1")
    if not invs:
        print("No draft invoices")
        await p.disconnect()
        return
        
    inv = invs[0]
    inv_id = inv['id']
    print(f"Posting invoice {inv_id}")
    
    try:
        await AccountingService.post_invoice(inv_id)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
        
    await p.disconnect()

asyncio.run(main())
