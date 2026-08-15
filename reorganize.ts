import { Project } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// Create directories
const dirs = [
  'src/assets',
  'src/components/common',
  'src/components/layout',
  'src/components/features/accounting',
  'src/components/features/inventory',
  'src/components/features/sales',
  'src/components/features/purchasing',
  'src/components/features/payroll',
  'src/components/features/settings',
  'src/store',
  'src/lib',
  'src/services',
  'src/types',
  'src/utils',
];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveFile(oldPath: string, newPath: string) {
  const sourceFile = project.getSourceFile(oldPath);
  if (sourceFile) {
    // When changing filename (e.g. index.tsx -> main.tsx), use move() instead of moveToDirectory() if the name differs
    const destDir = path.dirname(newPath);
    const destName = path.basename(newPath);
    if (sourceFile.getBaseName() !== destName) {
        sourceFile.move(newPath);
    } else {
        sourceFile.moveToDirectory(destDir);
    }
    console.log(`Moved ${oldPath} -> ${newPath}`);
  }
}

function moveDirContent(oldDir: string, newDir: string) {
    const files = project.getSourceFiles(oldDir + '/**/*');
    for (const f of files) {
        f.moveToDirectory(newDir);
        console.log(`Moved ${f.getFilePath()} -> ${newDir}`);
    }
}

// 1. Move root level files
moveFile('App.tsx', 'src/App.tsx');
moveFile('index.tsx', 'src/main.tsx');
moveFile('constants.tsx', 'src/utils/constants.tsx');
moveFile('types.ts', 'src/types/index.ts');

// 2. Move lib, services, store
moveDirContent('lib', 'src/lib');
moveDirContent('services', 'src/services');
moveDirContent('store', 'src/store');

// 3. Move components based on rules
const components = project.getSourceFiles('components/**/*');
for (const file of components) {
  const baseName = file.getBaseName();
  let dest = 'src/components/common';
  
  // Layout
  if (['Sidebar.tsx', 'Breadcrumbs.tsx', 'AuthPages.tsx', 'Dashboard.tsx', 'GlobalSearch.tsx'].includes(baseName)) {
    dest = 'src/components/layout';
  }
  // Accounting
  else if (['JournalManager.tsx', 'ChartOfAccounts.tsx', 'LedgerView.tsx', 'CashLedgerView.tsx', 'FinancialReports.tsx', 'PartnerLedgerReport.tsx', 'MonthlyGeneralLedgerReport.tsx'].includes(baseName)) {
    dest = 'src/components/features/accounting';
  }
  // Sales
  else if (['InvoiceManager.tsx', 'CreditNoteManager.tsx', 'CreditNoteAnalysis.tsx', 'ReceivablePayableSummary.tsx', 'ProductSalesAnalysis.tsx'].includes(baseName)) {
    dest = 'src/components/features/sales';
  }
  // Purchasing
  else if (['BillManager.tsx', 'ExpenseManager.tsx', 'PaymentManager.tsx'].includes(baseName)) {
    dest = 'src/components/features/purchasing';
  }
  // Inventory
  else if (['ProductList.tsx', 'InventoryAdjustmentManager.tsx', 'InventoryValuationReport.tsx'].includes(baseName)) {
    dest = 'src/components/features/inventory';
  }
  // Payroll / HR
  else if (['PayrollModule.tsx', 'FaceAttendance.tsx', 'UserManagement.tsx', 'LoanManager.tsx'].includes(baseName)) {
    dest = 'src/components/features/payroll';
  }
  // Settings / Contacts
  else if (['Settings.tsx', 'ContactManager.tsx', 'BrandManager.tsx', 'CategoryManager.tsx'].includes(baseName)) {
    dest = 'src/components/features/settings';
  }

  file.moveToDirectory(dest);
  console.log(`Moved ${baseName} -> ${dest}`);
}

project.saveSync();
console.log('Project reorganized successfully!');
