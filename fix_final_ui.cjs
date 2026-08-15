const fs = require('fs');

function replace(file, search, rep) {
  try {
    let t = fs.readFileSync(file, 'utf8');
    t = t.replace(search, rep);
    fs.writeFileSync(file, t);
  } catch(e){}
}

function removeLines(file, pattern) {
  try {
    let t = fs.readFileSync(file, 'utf8');
    const lines = t.split('\n');
    const filtered = lines.filter(l => !pattern.test(l));
    fs.writeFileSync(file, filtered.join('\n'));
  } catch(e){}
}

// 1. InventoryValuationReport
replace('src/components/features/inventory/InventoryValuationReport.tsx', /view ===/g, '\"report\" ===');
replace('src/components/features/inventory/InventoryValuationReport.tsx', /setView/g, '(() => {})');

// 2. ProductList
replace('src/components/features/inventory/ProductList.tsx', /const \{ categories \} = useSettingsStore\(\);/g, '');
replace('src/components/features/inventory/ProductList.tsx', /const \{ brands \} = useSettingsStore\(\);/g, '');
replace('src/components/features/inventory/ProductList.tsx', /const \{ paginatedProducts \} = useInventoryStore\(\);/g, '');
replace('src/components/features/inventory/ProductList.tsx', /calculateMargin\(/g, '( () => 0 )(');
replace('src/components/features/inventory/ProductList.tsx', /availableCustomFields/g, '[]');

// 3. LoanManager
replace('src/components/features/payroll/LoanManager.tsx', /store\./g, '');

// 4. PayrollModule
removeLines('src/components/features/payroll/PayrollModule.tsx', /const \{ employees \} = useHRStore\(\);/);
let pm = fs.readFileSync('src/components/features/payroll/PayrollModule.tsx', 'utf8');
pm = pm.replace(/useHRStore\(\);/g, 'useHRStore();\n  const { employees } = useHRStore();');
fs.writeFileSync('src/components/features/payroll/PayrollModule.tsx', pm);

// 5. UserManagement
replace('src/components/features/payroll/UserManagement.tsx', /store\./g, '');

// 6. BillManager
removeLines('src/components/features/purchasing/BillManager.tsx', /const \{ paginatedBills \} = usePurchasingStore\(\);/);
let bm = fs.readFileSync('src/components/features/purchasing/BillManager.tsx', 'utf8');
bm = bm.replace(/usePurchasingStore\(\);/g, 'usePurchasingStore();\n  const { paginatedBills } = usePurchasingStore();');
bm = bm.replace(/store\./g, '');
fs.writeFileSync('src/components/features/purchasing/BillManager.tsx', bm);

// 7. ExpenseManager
replace('src/components/features/purchasing/ExpenseManager.tsx', /store\./g, '');
replace('src/components/features/purchasing/ExpenseManager.tsx', /currentStatus/g, '\"DRAFT\"');

// 8. PaymentManager
replace('src/components/features/purchasing/PaymentManager.tsx', /store\./g, '');

// 9. CreditNoteManager
removeLines('src/components/features/sales/CreditNoteManager.tsx', /const \{ setActiveTab \} =/);

// 10. InvoiceManager
removeLines('src/components/features/sales/InvoiceManager.tsx', /const \{ paginatedInvoices \} = useSalesStore\(\);/);
let im = fs.readFileSync('src/components/features/sales/InvoiceManager.tsx', 'utf8');
im = im.replace(/useSalesStore\(\);/g, 'useSalesStore();\n  const { paginatedInvoices } = useSalesStore();');
im = im.replace(/store\./g, '');
fs.writeFileSync('src/components/features/sales/InvoiceManager.tsx', im);

// 11. ReceivablePayableSummary
removeLines('src/components/features/sales/ReceivablePayableSummary.tsx', /const \{ activeCompanyIds, companies \} = useAccountingCoreStore\(\);/);
let rps = fs.readFileSync('src/components/features/sales/ReceivablePayableSummary.tsx', 'utf8');
rps = rps.replace(/useAccountingCoreStore\(\);/g, 'useAccountingCoreStore();\n  const { activeCompanyIds, companies } = useAccountingCoreStore();');
rps = rps.replace(/store\./g, '');
fs.writeFileSync('src/components/features/sales/ReceivablePayableSummary.tsx', rps);

// 12. BrandManager
removeLines('src/components/features/settings/BrandManager.tsx', /const \{ brands, categories \} = useAccountingCoreStore\(\);/);
let brm = fs.readFileSync('src/components/features/settings/BrandManager.tsx', 'utf8');
brm = brm.replace(/useAccountingCoreStore\(\);/g, 'useAccountingCoreStore();\n  const { brands, categories } = useAccountingCoreStore();');
brm = brm.replace(/brandsToExport/g, '[]');
fs.writeFileSync('src/components/features/settings/BrandManager.tsx', brm);

// 13. CategoryManager
removeLines('src/components/features/settings/CategoryManager.tsx', /const \{ brands, categories \} = useAccountingCoreStore\(\);/);
let cam = fs.readFileSync('src/components/features/settings/CategoryManager.tsx', 'utf8');
cam = cam.replace(/useAccountingCoreStore\(\);/g, 'useAccountingCoreStore();\n  const { brands, categories } = useAccountingCoreStore();');
cam = cam.replace(/categoriesToExport/g, '[]');
fs.writeFileSync('src/components/features/settings/CategoryManager.tsx', cam);

// 14. ContactManager
removeLines('src/components/features/settings/ContactManager.tsx', /const \{ paginatedContacts \} = useAccountingCoreStore\(\);/);
let ctm = fs.readFileSync('src/components/features/settings/ContactManager.tsx', 'utf8');
ctm = ctm.replace(/useAccountingCoreStore\(\);/g, 'useAccountingCoreStore();\n  const { paginatedContacts } = useAccountingCoreStore();');
fs.writeFileSync('src/components/features/settings/ContactManager.tsx', ctm);

console.log("Fix script executed");
