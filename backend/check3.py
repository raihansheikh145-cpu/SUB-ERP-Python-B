import asyncio
import os
from dotenv import load_dotenv
from app.core.db import prisma

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

async def test():
    await prisma.connect()
    try:
        lines = await prisma.query_raw("SELECT id, invoice_id, product_id, line_value, type FROM docs_invoice_lines WHERE invoice_id='temp-13ff8343-1b1f-41e7-b9e9-1bffe0c2d734'")
        for l in lines:
            print(l)
    finally:
        await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(test())
