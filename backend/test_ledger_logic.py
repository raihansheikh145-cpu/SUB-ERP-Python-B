import asyncio
from prisma import Prisma
import os, json

async def main():
    with open("../.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip().strip("\"").strip("'")
    db = Prisma()
    await db.connect()
    
    # get active loan
    loan = await db.query_raw("SELECT * FROM docs_loans WHERE id = 'c95d0790-b93e-437c-9a65-87e4bcc8f055'")
    if not loan:
        print("Loan not found")
        await db.disconnect()
        return
    loan = loan[0]
    
    # get all journal lines with this contact_id
    contact_id = loan["contact_id"]
    lines = await db.query_raw("SELECT * FROM docs_journal_lines WHERE contact_id = $1", contact_id)
    
    journal_ids = list(set([l["journal_id"] for l in lines]))
    if loan["journal_entry_id"]:
        journal_ids.append(loan["journal_entry_id"])
        
    ids_str = ",".join(f"'{i}'" for i in journal_ids)
    journals = await db.query_raw(f"SELECT * FROM docs_journals WHERE id IN ({ids_str})")
    
    all_lines = await db.query_raw(f"SELECT * FROM docs_journal_lines WHERE journal_id IN ({ids_str})")
    
    print(f"Found {len(journals)} journals and {len(all_lines)} lines")
    
    # get accounts
    accounts = await db.query_raw("SELECT * FROM docs_accounts")
    
    loanAccountCode = "210100" if loan["type"] == "RECEIVED" else "100601"
    possibleLoanAccountIds = [a["id"] for a in accounts if a["code"] == loanAccountCode]
    
    possibleInterestAccountIds = [
        a["id"] for a in accounts 
        if a["code"] in ['500208', '600000', '400200'] or ('interest' in str(a.get("name") or "").lower())
    ]
    
    rows = []
    for entry in journals:
        entry_lines = [l for l in all_lines if l["journal_id"] == entry["id"]]
        for line in entry_lines:
            acc_id = line["account_id"]
            isLoanAccount = acc_id in possibleLoanAccountIds
            isInterestAccount = acc_id in possibleInterestAccountIds
            isLoanContact = line["contact_id"] == loan["contact_id"]
            
            isPrincipalLine = isLoanAccount or (len(possibleLoanAccountIds) == 0 and isLoanContact) or ("Principal" in str(line.get("description") or ""))
            isInterestLine = isInterestAccount or ("interest" in str(line.get("description") or "").lower())
            
            if isPrincipalLine or isInterestLine:
                if not line["debit"] and not line["credit"]:
                    continue
                rows.append({
                    "id": line["id"],
                    "journalId": entry["id"],
                    "isInterest": isInterestLine and not isPrincipalLine
                })
                
    print(f"Generated {len(rows)} ledger rows:")
    for r in rows:
        print(r)
        
    await db.disconnect()

asyncio.run(main())
