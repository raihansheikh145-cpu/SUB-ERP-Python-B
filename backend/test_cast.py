import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    
    table = "docs_loans"
    doc_id = "test-loan-1"
    start_date = "2026-08-14"
    company_id = "test-company"
    loan_number = "LOAN-123456"
    status = "DRAFT"
    
    query = f"""
        INSERT INTO {table} (id, start_date, company_id, loan_number, status, updated_at)
        VALUES ($1, $2::date, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE SET start_date = EXCLUDED.start_date, updated_at = NOW()
    """
    
    try:
        await db.execute_raw(query, doc_id, start_date, company_id, loan_number, status)
        print("Success with $2::date!")
        
        # Cleanup
        await db.execute_raw(f"DELETE FROM {table} WHERE id = $1", doc_id)
    except Exception as e:
        print("Error:", e)
        
    await db.disconnect()

asyncio.run(main())
