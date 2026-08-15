import asyncio
import os
from dotenv import load_dotenv
load_dotenv('.env')
from app.core.db import prisma

async def test():
    await prisma.connect()
    try:
        cols = await prisma.query_raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'docs_credit_notes'")
        print([c['column_name'] for c in cols])
    finally:
        await prisma.disconnect()

asyncio.run(test())
