const fs = require('fs');
let code = fs.readFileSync('components/BillManager.tsx', 'utf8');

code = code.replace(
    /setEditingId\(newBill\.id\);/,
    "setEditingId(finalBill.id);"
);

code = code.replace(
    /\} else if \(post\) \{\s*setShowForm\(false\);\s*\}/,
    `} else if (post) {\n        // Do not close form automatically so user can see the audit log and confirmed status\n      }`
);

fs.writeFileSync('components/BillManager.tsx', code);
console.log('patched');
