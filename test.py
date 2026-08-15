import asyncio
from prisma import Prisma
import json

async def main():
    db = Prisma()
    await db.connect()
    
    query = """
        SELECT 
            jl.contact_id as partner_id,
            j.id as journal_id,
            j.date::text as journal_date,
            a.name as account_name,
            j.reference_number as reference,
            COALESCE(jl.description, j.description) as description,
            u.name as responsible_name,
            jl.debit,
            jl.credit
        FROM docs_journal_lines jl
        JOIN docs_journals j ON jl.journal_id = j.id
        JOIN docs_accounts a ON jl.account_id = a.id
        LEFT JOIN docs_contacts c ON jl.contact_id = c.id
        LEFT JOIN docs_users u ON j.created_by_id = u.id
        WHERE jl.contact_id IS NOT NULL AND c.type = 'CUSTOMER'
    """
    res = await db.query_raw(query)
    print(len(res))
    await db.disconnect()

asyncio.run(main())
