const fs = require('fs');
const store = fs.readFileSync('store/useAccountingStore.ts', 'utf8');
const regex = /updateInvoice: async \(id, updates\)(?:.|\n)*?try \{((?:.|\n)*?)catch/g;
let match;
while ((match = regex.exec(store)) !== null) {
    console.log(match[0].substring(0, 1000));
}
