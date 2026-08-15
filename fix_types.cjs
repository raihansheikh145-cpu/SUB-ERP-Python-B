const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

async function main() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true
  });
  project.addSourceFilesAtPaths('src/store/modules/*.ts');

  let totalReplaced = 0;
  for (const sourceFile of project.getSourceFiles()) {
    let fileText = sourceFile.getFullText();
    
    // First, let's just do regex replacements for the exact broken strings created by the previous script
    // My previous script replaced: `useAccountingCoreStore.getState().User`, etc.
    const typeNames = [
      'User', 'Invoice', 'Contact', 'CreditNote', 'Company', 'Account', 'Warehouse', 'ContactType', 'Bill', 'Payment', 'JournalEntry', 'Product', 'Employee', 'Attendance', 'Loan'
    ];
    
    for (const type of typeNames) {
      const regex1 = new RegExp(`useAccountingCoreStore\\.getState\\(\\)\\.${type}\\b`, 'g');
      const regex2 = new RegExp(`get\\(\\)\\.${type}\\b`, 'g');
      fileText = fileText.replace(regex1, type);
      fileText = fileText.replace(regex2, type);
    }

    fs.writeFileSync(sourceFile.getFilePath(), fileText);
    totalReplaced++;
  }
  
  console.log(`Types fixed in files.`);
}

main().catch(console.error);
