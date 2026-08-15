import asyncio
from prisma import Prisma
from dotenv import load_dotenv
load_dotenv()

async def main():
    db = Prisma()
    await db.connect()
    company_id = 'd9dbb775-6839-4201-9dda-caa39e271201'
    
    # Target (Original) AR Account
    target_ar_id = 'd9dbb775-6839-4201-9dda-caa39e271201-100201'
    # Duplicate AR Account
    dup_ar_id = 'acc-ar-d9dbb775-6839-4201-9dda-caa39e271201'
    # Real Cash Account
    cash_id = 'd9dbb775-6839-4201-9dda-caa39e271201-100100'
    
    # 1. Merge Duplicate AR Account -> Original AR Account
    print("Merging duplicate AR account...")
    await db.execute_raw("UPDATE docs_journal_lines SET account_id = $1 WHERE account_id = $2", target_ar_id, dup_ar_id)
    await db.execute_raw("UPDATE docs_payments SET account_id = $1 WHERE account_id = $2", target_ar_id, dup_ar_id)
    await db.execute_raw("UPDATE docs_payments SET partner_account_id = $1 WHERE partner_account_id = $2", target_ar_id, dup_ar_id)
    await db.execute_raw("DELETE FROM docs_accounts WHERE id = $1", dup_ar_id)
    
    # 2. Fix CPAY Journals that debited AR instead of Cash
    # We find all CPAY journals for this company
    journals = await db.query_raw("SELECT id FROM docs_journals WHERE company_id = $1 AND journal_type = 'CUST_PAY'", company_id)
    for j in journals:
        j_id = j['id']
        lines = await db.query_raw("SELECT id, debit, credit, account_id FROM docs_journal_lines WHERE journal_id = $1", j_id)
        
        # If both lines are the AR account (target_ar_id), one should be Cash
        ar_lines = [l for l in lines if l['account_id'] == target_ar_id]
        if len(ar_lines) == 2:
            print(f"Fixing Journal {j_id} - both lines are AR")
            for l in lines:
                if l['debit'] > 0:
                    # Debit should be cash for Customer Payment
                    await db.execute_raw("UPDATE docs_journal_lines SET account_id = $1 WHERE id = $2", cash_id, l['id'])
                    
        elif len(ar_lines) == 1:
            # Check if there is a cash line. If not, it means the other line is something else.
            cash_lines = [l for l in lines if l['account_id'] == cash_id]
            if not cash_lines:
                # Find the line that is NOT AR
                other_line = [l for l in lines if l['account_id'] != target_ar_id]
                if other_line and other_line[0]['debit'] > 0:
                    print(f"Fixing Journal {j_id} - debit line is {other_line[0]['account_id']}, changing to Cash")
                    await db.execute_raw("UPDATE docs_journal_lines SET account_id = $1 WHERE id = $2", cash_id, other_line[0]['id'])

    # 3. Fix Payments where account_id was set to AR instead of Cash
    await db.execute_raw("UPDATE docs_payments SET account_id = $1 WHERE account_id = $2 AND type IN ('RECEIPT', 'COLLECTION')", cash_id, target_ar_id)

    print("Done!")
    await db.disconnect()

asyncio.run(main())
