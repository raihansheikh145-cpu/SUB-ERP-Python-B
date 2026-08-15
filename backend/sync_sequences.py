import asyncio
import os

with open('../.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip().strip('"')

from prisma import Prisma

async def main():
    prisma = Prisma()
    await prisma.connect()
    
    print("Syncing sequences...")
    # Get max sequences for invoices
    invs = await prisma.query_raw("""
        SELECT company_id, MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)) as max_seq
        FROM docs_invoices 
        WHERE invoice_number ~ '\d+$'
        GROUP BY company_id
    """)
    for row in invs:
        c_id = row['company_id']
        m_seq = row['max_seq'] or 0
        if m_seq > 0:
            await prisma.execute_raw("""
                INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
                VALUES ($1, 'INV', $2)
                ON CONFLICT (company_id, document_type) 
                DO UPDATE SET last_sequence = GREATEST(docs_document_sequences.last_sequence, $2)
            """, c_id, m_seq)
            print(f"Set INV for {c_id} to {m_seq}")

    # For bills
    bills = await prisma.query_raw("""
        SELECT company_id, MAX(CAST(SUBSTRING(bill_number FROM '\d+$') AS INTEGER)) as max_seq
        FROM docs_bills 
        WHERE bill_number ~ '\d+$'
        GROUP BY company_id
    """)
    for row in bills:
        c_id = row['company_id']
        m_seq = row['max_seq'] or 0
        if m_seq > 0:
            await prisma.execute_raw("""
                INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
                VALUES ($1, 'BILL', $2)
                ON CONFLICT (company_id, document_type) 
                DO UPDATE SET last_sequence = GREATEST(docs_document_sequences.last_sequence, $2)
            """, c_id, m_seq)
            print(f"Set BILL for {c_id} to {m_seq}")
            
    # For payments
    pays = await prisma.query_raw("""
        SELECT company_id, MAX(CAST(SUBSTRING(payment_number FROM '\d+$') AS INTEGER)) as max_seq
        FROM docs_payments 
        WHERE payment_number ~ '\d+$'
        GROUP BY company_id
    """)
    for row in pays:
        c_id = row['company_id']
        m_seq = row['max_seq'] or 0
        if m_seq > 0:
            await prisma.execute_raw("""
                INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
                VALUES ($1, 'PAY', $2)
                ON CONFLICT (company_id, document_type) 
                DO UPDATE SET last_sequence = GREATEST(docs_document_sequences.last_sequence, $2)
            """, c_id, m_seq)
            print(f"Set PAY for {c_id} to {m_seq}")
            
    # For credit notes
    cns = await prisma.query_raw("""
        SELECT company_id, MAX(CAST(SUBSTRING(credit_note_number FROM '\d+$') AS INTEGER)) as max_seq
        FROM docs_credit_notes 
        WHERE credit_note_number ~ '\d+$'
        GROUP BY company_id
    """)
    for row in cns:
        c_id = row['company_id']
        m_seq = row['max_seq'] or 0
        if m_seq > 0:
            await prisma.execute_raw("""
                INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
                VALUES ($1, 'CN', $2)
                ON CONFLICT (company_id, document_type) 
                DO UPDATE SET last_sequence = GREATEST(docs_document_sequences.last_sequence, $2)
            """, c_id, m_seq)
            print(f"Set CN for {c_id} to {m_seq}")

    await prisma.disconnect()
    print("Done")

asyncio.run(main())
