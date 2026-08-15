const fs = require('fs');

const data = fs.readFileSync('backend/db_dump.json', 'utf8').trim().split('\n');
const linesStr = data[0].substring(11);
const acctsStr = data[1].substring(14);

const lines = JSON.parse(linesStr);
const accounts = JSON.parse(acctsStr);

const selectedLoan = {
    id: "c95d0790-b93e-437c-9a65-87e4bcc8f055",
    type: "RECEIVED",
    contact_id: "f75e1ef5-9d72-430a-badc-f0ac50b9cc11",
    journal_entry_id: "JE-LOAN-c95d0790-b93e-437c-9a65-87e4bcc8f055"
};

const loanContactId = selectedLoan.contactId || selectedLoan.contact_id;
const loanAccountCode = selectedLoan.type === "RECEIVED" ? "210100" : "100601";
const interestAccountCode = selectedLoan.type === "RECEIVED" ? "500208" : "400200";

const possibleLoanAccountIds = (accounts || [])
  .filter((a) => String(a.code) === loanAccountCode)
  .map((a) => a.id);
  
const possibleInterestAccountIds = (accounts || [])
  .filter((a) => String(a.code) === interestAccountCode)
  .map((a) => a.id);

console.log("possibleLoanAccountIds:", possibleLoanAccountIds);
console.log("possibleInterestAccountIds:", possibleInterestAccountIds);

const loanLedgerRows = [];

// Simulate fetchLoanJournalEntries
const journalMap = new Map();
lines.forEach(line => {
    if (!journalMap.has(line.journal_id)) {
        journalMap.set(line.journal_id, {
            id: line.journal_id,
            date: line.date,
            description: line.description || "",
            reference: line.reference_number || "",
            period: parseInt(line.journal_id.split('-').pop()),
            lines: []
        });
    }
    const j = journalMap.get(line.journal_id);
    j.lines.push({
        id: line.id,
        journalId: line.journal_id,
        accountId: line.account_id,
        contactId: line.contact_id,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        description: line.description
    });
});

const loanJournalEntries = Array.from(journalMap.values());

loanJournalEntries.forEach((entry) => {
  (entry.lines || []).forEach((line) => {
    const lineContactId = line.contactId || line.contact_id;
    const lineAccountId = line.accountId || line.account_id;
    
    const isLoanContact = Boolean(loanContactId) && lineContactId === loanContactId;
    const isLoanAccount = possibleLoanAccountIds.includes(lineAccountId);
    const isInterestAccount = possibleInterestAccountIds.includes(lineAccountId);

    const isPrincipalLine = isLoanAccount || (possibleLoanAccountIds.length === 0 && isLoanContact) || String(line.description || "").includes("Principal");
    const isInterestLine = isInterestAccount || String(line.description || "").toLowerCase().includes("interest");

    if (isPrincipalLine || isInterestLine) {
        loanLedgerRows.push({
            journalId: entry.id,
            date: entry.date,
            description: line.description || entry.description || "",
            debit: line.debit || 0,
            credit: line.credit || 0,
            isInterest: isInterestLine && !isPrincipalLine,
        });
    }
  });
});

console.log("loanLedgerRows count:", loanLedgerRows.length);
console.log("Rows:", loanLedgerRows);

const entry1 = { period: 1, principal: 799.51 };
let foundPrincipal = 0;
const matchingRows = loanLedgerRows.filter(r => 
  String(r.journalId).endsWith(`-${entry1.period}`)
);
matchingRows.forEach(r => {
    const amount = selectedLoan.type === 'RECEIVED' ? r.debit : r.credit;
    if (amount > 0 && !r.isInterest) foundPrincipal += amount;
});
console.log("Found Principal for Pd 1:", foundPrincipal);

