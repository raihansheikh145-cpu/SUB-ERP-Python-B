import asyncio
import uuid
from app.core.db import prisma

async def create_companies():
    companies = [
        {"name": "Suborno Electric", "code": "SE"},
        {"name": "Star Light House", "code": "SLH"},
        {"name": "Suborno Sanitary Mart", "code": "SSM"},
        {"name": "Global Marketing", "code": "GM"},
        {"name": "Global Electric", "code": "GE"},
        {"name": "Suborno New", "code": "SN"},
        {"name": "Suborno Electric Tyre & Battery", "code": "SETB"}
    ]

    await prisma.connect()
    try:
        # Check if data column exists
        res = await prisma.query_raw('''
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'docs_companies' AND column_name = 'data'
        ''')
        
        has_data = len(res) > 0
        if not has_data:
            print("Adding data column as JSONB to docs_companies")
            await prisma.query_raw("ALTER TABLE docs_companies ADD COLUMN data JSONB DEFAULT '{}'::jsonb")
            
        for c in companies:
            cid = str(uuid.uuid4())
            # Insert into docs_companies
            await prisma.query_raw("""
                INSERT INTO docs_companies (id, company_id, code, name, data, updated_at)
                VALUES ($1, $1, $2, $3, $4::jsonb, now())
                ON CONFLICT (id) DO NOTHING
            """, cid, c["code"], c["name"], '{"currency": "BDT", "industry": "Retail"}')
            print(f"Inserted {c['name']} with ID {cid}")
            
    except Exception as e:
        print("Error:", e)
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(create_companies())
