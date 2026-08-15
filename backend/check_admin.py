import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    try:
        users = await prisma.query_raw("""
            SELECT email, role_id, company_ids FROM docs_users
        """)
        for u in users:
            print(f"Email: {u['email']}, Role: {u['role_id']}, Companies: {u['company_ids']}")
    finally:
        await prisma.disconnect()

asyncio.run(main())
