const fs = require('fs');

const path = 'prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const tablesForAudit = [
    'DocsInvoices', 'DocsBills', 'DocsPayments', 'DocsJournals',
    'DocsCreditNotes', 'DocsInventoryTransactions', 'DocsInventoryAdjustments'
];

let newLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore lines that have 'data' and 'Json' unless it's in the datasource block
    if (line.includes('data') && line.includes('Json')) {
        continue;
    }
    newLines.push(line);
    for (const table of tablesForAudit) {
        if (line.includes(`model ${table} {`)) {
            newLines.push('  audit_log  Json?');
        }
    }
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Schema updated successfully.');
