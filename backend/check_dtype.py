import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    
    cols_res = await db.query_raw(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
        "docs_loans"
    )
    db_columns = {row["column_name"]: row["data_type"] for row in cols_res}
    
    for k, v in db_columns.items():
        print(f"{k}: {v} (type: {type(v)})")
        
    await db.disconnect()

asyncio.run(main())
