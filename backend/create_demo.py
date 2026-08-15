import asyncio
import uuid
import json
from app.core.db import prisma

async def main():
    await prisma.connect()
    
    product_id = str(uuid.uuid4())
    company_id = "00000000-0000-0000-0000-000000000000"
    product_data = {
        "sku": "DEMO-001",
        "name": "Demo Product Pro",
        "cost_price": 49.99,
        "sales_price": 99.99,
        "description": "A fantastic demo product created automatically."
    }
    
    await prisma.execute_raw(
        '''
        INSERT INTO docs_products (id, company_id, type, company_ids, data) 
        VALUES ($1, $2, 'PRODUCT', $3::jsonb, $4::jsonb)
        ''',
        product_id,
        company_id,
        json.dumps([company_id]),
        json.dumps(product_data)
    )
    
    print("Demo product created successfully.")
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
