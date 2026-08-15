const fs = require('fs');
const { execSync } = require('child_process');

const INITIAL_ACCOUNTS = [
    {id: '100100', code: '100100', name: 'Cash', type: 'ASSET', subType: 'CASH'},
    {id: '100201', code: '100201', name: 'Accounts Receivable', type: 'ASSET', subType: 'ACCOUNTS_RECEIVABLE'},
    {id: '100300', code: '100300', name: 'Advance to Suppliers', type: 'ASSET', subType: 'OTHER_CURRENT_ASSET'},
    {id: '100400', code: '100400', name: 'Prepaid Expenses', type: 'ASSET', subType: 'OTHER_CURRENT_ASSET'},
    {id: '100501', code: '100501', name: 'Inventory Asset', type: 'ASSET', subType: 'INVENTORY'},
    {id: '100502', code: '100502', name: 'Finished Goods', type: 'ASSET', subType: 'INVENTORY'},
    {id: '200101', code: '200101', name: 'Accounts Payable', type: 'LIABILITY', subType: 'ACCOUNTS_PAYABLE'},
    {id: '200201', code: '200201', name: 'Credit Card', type: 'LIABILITY', subType: 'CREDIT_CARD'},
    {id: '200300', code: '200300', name: 'Advance from Customers', type: 'LIABILITY', subType: 'OTHER_CURRENT_LIABILITY'},
    {id: '200400', code: '200400', name: 'VAT/Tax Payable', type: 'LIABILITY', subType: 'OTHER_CURRENT_LIABILITY'},
    {id: '200500', code: '200500', name: 'Accrued Expenses', type: 'LIABILITY', subType: 'OTHER_CURRENT_LIABILITY'},
    {id: '300100', code: '300100', name: "Owner's Equity", type: 'EQUITY', subType: 'EQUITY'},
    {id: '300200', code: '300200', name: 'Retained Earnings', type: 'EQUITY', subType: 'RETAINED_EARNINGS'},
    {id: '400100', code: '400100', name: 'Sales Revenue', type: 'REVENUE', subType: 'REVENUE'},
    {id: '400200', code: '400200', name: 'Service Revenue', 'type': 'REVENUE', subType: 'REVENUE'},
    {id: '400300', code: '400300', name: 'Discount Given', type: 'REVENUE', subType: 'REVENUE'},
    {id: '400400', code: '400400', name: 'Other Income', type: 'REVENUE', subType: 'OTHER_REVENUE'},
    {id: '500101', code: '500101', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COGS'},
    {id: '600100', code: '600100', name: 'Rent Expense', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600200', code: '600200', name: 'Utility Expense', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600300', code: '600300', name: 'Salary Expense', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600400', code: '600400', name: 'Office Supplies', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600500', code: '600500', name: 'Bank Charges', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600600', code: '600600', name: 'Travel Expense', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600700', code: '600700', name: 'Meals and Entertainment', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600800', code: '600800', name: 'Marketing & Advertising', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '600900', code: '600900', name: 'Repairs & Maintenance', type: 'EXPENSE', subType: 'EXPENSE'},
    {id: '601000', code: '601000', name: 'Inventory Shrinkage', type: 'EXPENSE', subType: 'EXPENSE'}
];

const companies = [
    'd9dbb775-6839-4201-9dda-caa39e271201',
    'fa25c50f-2980-43ef-bb4c-14493734bede',
    'cbf98256-8950-4a30-9c56-0a75ba9d461b',
    '1948eec5-5894-46c6-bb94-e7ef65609857',
    '6e118177-329f-4cfa-a99d-180f3e73b02a',
    'f26e3d6f-390b-4cb2-ab54-c73329534495',
    '8d5aa9db-fe65-4731-9a5d-5fa2b94f014f'
];

let sql = '';
for (const c_id of companies) {
    for (const acc of INITIAL_ACCOUNTS) {
        const acc_id = `${c_id}-${acc.code}`;
        const data = JSON.stringify({
            id: acc_id,
            companyId: c_id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            subType: acc.subType
        });
        
        const escapedName = acc.name.replace(/'/g, "''");
        const escapedData = data.replace(/'/g, "''");
        
        sql += `INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES ('${acc_id}', '${c_id}', '${acc.code}', '${escapedName}', '${acc.type}', '${escapedData}') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data\n`;
    }
}

fs.writeFileSync('seed_accounts.sql', sql);
console.log('Successfully generated seed_accounts.sql');
