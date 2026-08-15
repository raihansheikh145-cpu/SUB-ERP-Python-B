const fs = require('fs');
const files = ['src/components/features/purchasing/BillManager.tsx', 'src/components/features/purchasing/PaymentManager.tsx', 'src/components/features/accounting/JournalManager.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/currentUser!\.\s*(\}|\]|\))/g, 'currentUser!.id $1');
  content = content.replace(/b\?\.\s*\|\|/g, 'b?.id ||');
  fs.writeFileSync(file, content);
});
