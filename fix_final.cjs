const fs = require('fs');

const fixDuplicates = (file, vars) => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace `const x = x;` or `const x = y.x;` or `const { x } = ...;`
    for (const v of vars) {
       const regexStr = `const\\s+${v}\\s*=\\s*${v};`;
       content = content.replace(new RegExp(regexStr, 'g'), `// removed ${v}`);
    }
    
    // Remove empty store
    content = content.replace(/store\./g, '');
    
    // Specific lines for JournalManager
    content = content.replace(/const paginatedEntries = paginatedEntries;/g, '// removed paginatedEntries');
    
    // PartnerLedgerReport
    content = content.replace(/const { activeCompanyIds } = store;/g, '// removed activeCompanyIds');
    content = content.replace(/const { activeCompanyIds } = useAccountingCoreStore\(\);/g, '// removed activeCompanyIds');
    
    // InventoryAdjustmentManager
    content = content.replace(/const products = products;/g, '// removed');
    content = content.replace(/const contacts = contacts;/g, '// removed');
    content = content.replace(/const inventoryAdjustments = inventoryAdjustments;/g, '// removed');
    
    // FinancialReports
    content = content.replace(/const { activeCompanyIds, companies } = store;/g, '// removed activeCompanyIds, companies');
    content = content.replace(/const { activeCompanyIds, companies } = useAccountingCoreStore\(\);/g, '// removed activeCompanyIds, companies');
    
    // QuickProductModal
    content = content.replace(/const { categories, brands } = useAccountingCoreStore\(\);/g, '// removed categories, brands');
    
    // AdvancedAnalysis
    content = content.replace(/const { users, resolveUserName, invoices, creditNotes, bills } = useAccountingCoreStore\(\);/g, '// removed advancedAnalysis dup');

    fs.writeFileSync(file, content);
}

fixDuplicates('src/components/features/accounting/JournalManager.tsx', ['paginatedEntries']);
fixDuplicates('src/components/features/accounting/PartnerLedgerReport.tsx', ['activeCompanyIds']);
fixDuplicates('src/components/features/inventory/InventoryAdjustmentManager.tsx', ['products', 'contacts', 'inventoryAdjustments']);
fixDuplicates('src/components/features/accounting/FinancialReports.tsx', []);
fixDuplicates('src/components/common/QuickProductModal.tsx', []);
fixDuplicates('src/components/common/AdvancedAnalysis.tsx', []);

// Fix InventoryValuationReport arguments one last time
let ivr = fs.readFileSync('src/components/features/inventory/InventoryValuationReport.tsx', 'utf8');
ivr = ivr.replace(/\(\(a:any\) => \{\}\)\(/g, 'setView(');
ivr = ivr.replace(/st,/g, '');
fs.writeFileSync('src/components/features/inventory/InventoryValuationReport.tsx', ivr);

console.log("Fixed remaining files.");
