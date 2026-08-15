const fs = require('fs');

function fixFile(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Common id replacement fixes
    code = code.replace(/setEditingId\(id\)/g, 'setEditingId(exactMatch ? exactMatch.id : (data ? data.id : null))');
    code = code.replace(/\|\| id === /g, '|| ');
    code = code.replace(/\|\| id\?.toUpperCase/g, '');
    code = code.replace(/onChange\(id\)/g, 'onChange(opt?.id)');
    code = code.replace(/bill\?\.idsalesperson/g, 'bill?.salesperson');
    code = code.replace(/inv\?\.idsalesperson/g, 'inv?.salesperson');
    code = code.replace(/const id = bill\?\.id;/g, '');
    code = code.replace(/selectedBillIds\.includes\(id\)/g, 'selectedBillIds.includes(bill?.id)');
    code = code.replace(/setEditingId\(id\);/g, 'setEditingId(bill?.id);');
    
    // In PaymentManager
    code = code.replace(/payment\.id === id/g, 'p?.id === payment?.id');
    
    fs.writeFileSync(file, code);
}

fixFile('src/components/features/accounting/JournalManager.tsx');
fixFile('src/components/features/purchasing/PaymentManager.tsx');
fixFile('src/components/features/payroll/LoanManager.tsx');
console.log('Fixed files');
