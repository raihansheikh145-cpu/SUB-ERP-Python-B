import asyncio
from app.core.db import prisma
import uuid

async def test():
    await prisma.connect()
    try:
        new_id = str(uuid.uuid4())
        print('Testing insert with id:', new_id)
        
        # Try inserting
        async with prisma.tx() as tx:
            res = await tx.query_raw('''
                INSERT INTO docs_products (id, name, type, company_id, updated_at)
                VALUES ($1, $2, $3, $4, now())
                RETURNING id, name
            ''', new_id, 'Test Insert', 'PRODUCT', '00000000-0000-0000-0000-000000000000')
            print('tx.query_raw result:', res)

        # Verify it exists
        check = await prisma.query_raw('SELECT id FROM docs_products WHERE id = $1', new_id)
        print('Check result:', check)

    except Exception as e:
        print('ERROR:', str(e))
    finally:
        await prisma.disconnect()

if __name__ == '__main__':
    asyncio.run(test())
