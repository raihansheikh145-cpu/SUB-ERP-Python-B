const fs = require('fs');
let code = fs.readFileSync('components/InvoiceManager.tsx', 'utf8');

code = code.replace(
  /if \(!post\) \{\n\s*updates\.messages = \[\.\.\.\(existingInvoice\?\.messages \|\| \[\]\), \{\n\s*id: crypto\.randomUUID\(\),\n\s*authorId: store\.currentUser\?\.id \|\| 'user-1',\n\s*body: 'Draft invoice updated\. Items and totals recalculated\.',\n\s*date: new Date\(\)\.toISOString\(\),\n\s*type: 'notification'\n\s*\}\];\n\s*\}/g,
  `// Detailed change log will be handled by store.updateInvoice`
);

fs.writeFileSync('components/InvoiceManager.tsx', code);
console.log('Patched InvoiceManager');
