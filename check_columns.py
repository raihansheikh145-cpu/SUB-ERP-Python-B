import asyncio, asyncpg
async def main():
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/suberp')
    rows = await conn.fetch("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'docs_invoices' ORDER BY ordinal_position;")
    for r in rows:
        print(f"{r['column_name']}: {r['data_type']} ({r['is_nullable']})")
    await conn.close()
asyncio.run(main())
