const fs = require('fs');
const files = ['src/components/features/purchasing/BillManager.tsx', 'src/components/features/purchasing/PaymentManager.tsx', 'src/components/features/accounting/JournalManager.tsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\b([a-zA-Z0-9_]+)\?\.\?\.toUpperCase\(\)/g, '$1?.id?.toUpperCase()');
  content = content.replace(/\(\s*([a-zA-Z0-9_]+)\s*(?::\s*any|\s*:.*)?\s*\)\s*=>\s*\.id/g, '($1: any) => $1?.id');
  content = content.replace(/([a-zA-Z0-9_]+)\?\.\s*===/g, '$1?.id ===');
  content = content.replace(/(?<![a-zA-Z0-9_\]\)])\.id\b/g, 'id'); 
  fs.writeFileSync(file, content);
});
