import asyncio
import asyncpg
import json

async def main():
    conn = await asyncpg.connect("postgresql://postgres:123456@localhost:5432/sub_erp")
    rows = await conn.fetch("SELECT id, status, journal_entry_id FROM docs_loans ORDER BY updated_at DESC LIMIT 5")
    for row in rows:
        print(dict(row))
    await conn.close()

asyncio.run(main())
