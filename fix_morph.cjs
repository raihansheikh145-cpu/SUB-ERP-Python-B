const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

async function main() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true
  });
  
  const files = [
    'src/components/features/inventory/InventoryValuationReport.tsx',
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
  
  project.addSourceFilesAtPaths(files);
  
  for (const sourceFile of project.getSourceFiles()) {
    // 1. Remove duplicate VariableStatements
    const varDecls = sourceFile.getVariableDeclarations();
    const seenVariables = new Set();
    const duplicatesToRemove = [];
    
    for (const vd of varDecls) {
      if (vd.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern) {
         // check if all names inside this destructuring have been seen
         const elements = vd.getNameNode().getElements();
         let allSeen = elements.length > 0;
         for (const elem of elements) {
           const name = elem.getName();
           if (seenVariables.has(name)) {
             // It's a duplicate! We shouldn't process it.
           } else {
             allSeen = false;
             seenVariables.add(name);
           }
         }
         
         if (allSeen) {
           // We can remove this VariableStatement
           duplicatesToRemove.push(vd.getVariableStatement());
         }
      } else {
        const name = vd.getName();
        if (seenVariables.has(name)) {
          duplicatesToRemove.push(vd.getVariableStatement());
        } else {
          seenVariables.add(name);
        }
      }
    }
    
    for (const stmt of duplicatesToRemove) {
       try { stmt.remove(); } catch(e){}
    }
    
    // 2. Fix specific `store.` and others
    let fileText = sourceFile.getFullText();
    fileText = fileText.replace(/store\./g, '');
    fileText = fileText.replace(/\( \(\) => 0 \)\(/g, '((a:any,b:any) => 0)(');
    fileText = fileText.replace(/\"DRAFT\" = \"DRAFT\"/g, ''); // Fix expense manager
    fileText = fileText.replace(/view ===/g, '\"report\" ==='); // Fix InventoryValuation
    fileText = fileText.replace(/view \?/g, '\"report\" ?');
    
    fs.writeFileSync(sourceFile.getFilePath(), fileText);
  }
  
  console.log("Cleanup complete");
}

main().catch(console.error);
