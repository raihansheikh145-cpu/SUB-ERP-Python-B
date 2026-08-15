import asyncio
from app.core.db import prisma
import json

async def main():
    await prisma.connect()
    params = ["d9dbb775-6839-4201-9dda-caa39e271201"]
    where_sql = "j.company_id = ANY($1::text[]) AND jl.contact_id IS NOT NULL"
    
    query = f'''
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
        WHERE {where_sql}
        ORDER BY j.date ASC, j.created_at ASC
    '''
    res = await prisma.query_raw(query, params)
    print(len(res))
    await prisma.disconnect()

asyncio.run(main())
