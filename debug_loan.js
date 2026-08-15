const loanLedgerRows = [
  {
    "id": "line-1",
    "journalId": "JE-LPAY-c95d0790-b93e-437c-9a65-87e4bcc8f055-1",
    "date": "2026-08-14",
    "description": "Loan Payment Period 1: loan1",
    "reference": "PAY-1",
    "debit": 100.0,
    "credit": 0.0,
    "isInterest": false
  },
  {
    "id": "line-2",
    "journalId": "JE-LPAY-c95d0790-b93e-437c-9a65-87e4bcc8f055-1",
    "date": "2026-08-14",
    "description": "Loan Payment Period 1: loan1",
    "reference": "PAY-1",
    "debit": 10.0,
    "credit": 0.0,
    "isInterest": true
  },
  {
    "id": "line-3",
    "journalId": "JE-LPAY-c95d0790-b93e-437c-9a65-87e4bcc8f055-2",
    "date": "2026-08-14",
    "description": "Loan Payment Period 2: loan1",
    "reference": "PAY-2",
    "debit": 1000.0,
    "credit": 0.0,
    "isInterest": false
  }
];

const selectedLoan = { type: 'RECEIVED' };

const entry1 = { period: 1, principal: 799.51 };
const entry2 = { period: 2, principal: 805.51 };

function processEntry(entry) {
    let displayPrincipal = entry.principal || 0;
    let foundPrincipal = 0;
    let foundInterest = 0;
    
    const matchingRows = loanLedgerRows.filter(r => 
        String(r.journalId).endsWith(`-${entry.period}`) || 
        String(r.reference).includes(`PAY-${entry.period}`) ||
        String(r.description).includes(`Period ${entry.period}:`)
    );
    
    matchingRows.forEach(r => {
        const amount = selectedLoan.type === 'RECEIVED' ? r.debit : r.credit;
        if (amount > 0) {
            if (r.isInterest) foundInterest += amount;
            else foundPrincipal += amount;
        }
    });
    
    if (matchingRows.length > 0) {
        displayPrincipal = foundPrincipal;
    }
    console.log(`Period ${entry.period} matchingRows: ${matchingRows.length}, displayPrincipal: ${displayPrincipal}`);
}

processEntry(entry1);
processEntry(entry2);
