const fs = require('fs');
const files = ['src/components/features/purchasing/BillManager.tsx', 'src/components/features/purchasing/PaymentManager.tsx', 'src/components/features/accounting/JournalManager.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/filterState\?\.\s*(&&|\|\||\))/g, 'filterState?.id $1');
  content = content.replace(/&&\s*\.status\s*!==/g, '&& b?.status !==');
  content = content.replace(/\(\s*\.status\s*!==/g, '(b?.status !==');
  fs.writeFileSync(file, content);
});
