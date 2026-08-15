from app.core.db import prisma

async def generate_sequence(company_id: str, doc_prefix: str, tx=None) -> str:
    """
    Atomically generates a sequence number for a given document type using Postgres SELECT ... FOR UPDATE / ON CONFLICT logic.
    This fulfills the requirement to move sequence generation to FastAPI.
    """
    query = """
        INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
        VALUES ($1, $2, 1)
        ON CONFLICT (company_id, document_type) 
        DO UPDATE SET last_sequence = docs_document_sequences.last_sequence + 1
        RETURNING last_sequence;
    """
    db = tx if tx else prisma
    res = await db.query_raw(query, company_id, doc_prefix)
    new_seq = res[0]['last_sequence'] if res and len(res) > 0 else 1
    
    comp_res = await db.query_raw("SELECT code FROM docs_companies WHERE id = $1", company_id)
    comp_code = comp_res[0].get('code', 'UNK') if comp_res and len(comp_res) > 0 else 'UNK'
    
    final_number = f"{doc_prefix}-{comp_code}-{str(new_seq).zfill(6)}"
    return final_number

async def get_next_sequence_number(doc_type: str, company_id: str, doc_prefix: str, tx=None) -> str:
    return await generate_sequence(company_id, doc_prefix, tx)

