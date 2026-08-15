const fs = require('fs');
let code = fs.readFileSync('components/InvoiceManager.tsx', 'utf8');

// Fix setEditingId(newInvoice.id) issue for existing invoices
code = code.replace(
    /setEditingId\(newInvoice\.id\);/,
    "setEditingId(finalInvoice.id);"
);

fs.writeFileSync('components/InvoiceManager.tsx', code);
console.log('patched');
