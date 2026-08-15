const fs = require('fs');
let code = fs.readFileSync('process_invoice.sql', 'utf8');
code = code.replace(/updated_at = NOW\(\);/g, "messages = COALESCE(EXCLUDED.messages, docs_invoices.messages),\n            updated_at = NOW();");
fs.writeFileSync('process_invoice.sql', code);
console.log('Patched process_invoice.sql');
