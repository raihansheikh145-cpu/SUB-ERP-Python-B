import asyncio
from prisma import Prisma

async def main():
    p = Prisma()
    await p.connect()
    try:
        await p.execute_raw("""
            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, updated_at)
            VALUES ('TEST-JE-123', 'd9dbb775-6839-4201-9dda-caa39e271201', '2026-08-09'::date, '2026-08-09'::date, 'INV', 'DRAFT', 'INV-TEST-01', 'INV-TEST-01', NOW())
        """)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
    await p.disconnect()

asyncio.run(main())
