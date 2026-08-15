const fs = require('fs');
const files = ['src/components/features/purchasing/BillManager.tsx', 'src/components/features/purchasing/PaymentManager.tsx', 'src/components/features/accounting/JournalManager.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/l\s*=>\s*\.status\s*!==\s*id/g, 'l => l?.id !== id');
  content = content.replace(/=>\s*\.status\s*!==/g, '=> id !==');
  fs.writeFileSync(file, content);
});
