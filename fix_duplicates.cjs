const fs = require('fs');

const files = [
  'src/components/features/inventory/ProductList.tsx',
  'src/components/features/payroll/PayrollModule.tsx',
  'src/components/features/purchasing/BillManager.tsx',
  'src/components/features/purchasing/ExpenseManager.tsx',
  'src/components/features/sales/CreditNoteManager.tsx',
  'src/components/features/sales/InvoiceManager.tsx',
  'src/components/features/sales/ReceivablePayableSummary.tsx',
  'src/components/features/settings/BrandManager.tsx',
  'src/components/features/settings/CategoryManager.tsx',
  'src/components/features/settings/ContactManager.tsx'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  
  // The problem is that when I ran my AST script, it injected `const { ... } = use...Store();` multiple times.
  // We can just keep the FIRST occurrence of any such line, and remove subsequent exact matches.
  
  const lines = content.split('\n');
  const seenZustand = new Set();
  const outLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a Zustand hook call like `const { ... } = useSomethingStore();`
    // Or just `const ... = useSomethingStore();`
    const match = line.match(/const\s+(?:\{[^}]+\}|[a-zA-Z0-9_]+)\s*=\s*use[A-Za-z]+Store\(\);/);
    if (match) {
      if (seenZustand.has(match[0])) {
         // Skip duplicate!
         continue;
      }
      seenZustand.add(match[0]);
    }
    
    // Check for `store.`
    outLines.push(line.replace(/store\./g, ''));
  }
  
  fs.writeFileSync(f, outLines.join('\n'));
}

// Fix InventoryValuationReport arguments error
let ivr = fs.readFileSync('src/components/features/inventory/InventoryValuationReport.tsx', 'utf8');
ivr = ivr.replace(/\( \(\) => \{\} \)\(/g, '((a:any) => {})(');
fs.writeFileSync('src/components/features/inventory/InventoryValuationReport.tsx', ivr);

// Fix ProductList calculateMargin arguments
let pl = fs.readFileSync('src/components/features/inventory/ProductList.tsx', 'utf8');
pl = pl.replace(/\( \(\) => 0 \)\(/g, '((a:any, b:any) => 0)(');
fs.writeFileSync('src/components/features/inventory/ProductList.tsx', pl);

console.log("Deduplicated.");
