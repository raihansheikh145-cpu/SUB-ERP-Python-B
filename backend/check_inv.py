import asyncio
import os
from prisma import Prisma
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

async def main():
    p = Prisma()
    await p.connect()
    refunds = await p.query_raw("SELECT COALESCE(SUM(total), 0) as refunded FROM docs_credit_notes WHERE status = 'POSTED' AND origin_invoice_id = 'NON_EXISTENT'")
    print("Refunds:", refunds)
    print("Refunds[0]['refunded'] type:", type(refunds[0]["refunded"]))
    await p.disconnect()

asyncio.run(main())
