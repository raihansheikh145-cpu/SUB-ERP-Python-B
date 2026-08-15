import asyncio
from app.core.db import prisma

async def test():
    await prisma.connect()
    
    query = """
    SELECT 
        jl.contact_id as partner_id
    FROM docs_journal_lines jl
    JOIN docs_journals j ON jl.journal_id = j.id
    LEFT JOIN docs_contacts c ON jl.contact_id = c.id
    WHERE j.status = 'POSTED' 
      AND j.company_id = ANY($1::text[]) 
      AND c.type = $2
    """
    params = [["d9dbb775-6839-4201-9dda-caa39e271201"], "CUSTOMER"]
    
    try:
        res = await prisma.query_raw(query, *params)
        print("Rows matched:", len(res))
    except Exception as e:
        print("Error:", e)
        
    await prisma.disconnect()

asyncio.run(test())
