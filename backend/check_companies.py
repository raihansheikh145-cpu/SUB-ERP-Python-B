import asyncio
from app.core.db import prisma

async def main():
    await prisma.connect()
    try:
        companies = await prisma.query_raw("SELECT * FROM \"Company\"")
        print(f"Company table has {len(companies)} rows")
        for c in companies:
            print(c['name'])
    except Exception as e:
        print("Error with Company:", e)
        
    try:
        docs = await prisma.query_raw("SELECT * FROM docs_companies")
        print(f"docs_companies table has {len(docs)} rows")
    except Exception as e:
        print("Error with docs_companies:", e)
        
    finally:
        await prisma.disconnect()

asyncio.run(main())
