const fs = require('fs');
let content = fs.readFileSync('src/components/features/accounting/FinancialReports.tsx', 'utf8');

content = content.replace(/const \{ activeCompanyIds, currentCompany, getGeneralLedger \} = useAccountingCoreStore\(\);/g, 'const { getGeneralLedger } = useAccountingCoreStore.getState();');

content = content.replace(/const \{ activeCompanyIds, currentCompany \} = useAccountingCoreStore\(\);/g, '');

fs.writeFileSync('src/components/features/accounting/FinancialReports.tsx', content);
console.log("Fixed FinancialReports.tsx");
