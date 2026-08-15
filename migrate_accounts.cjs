const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:123456@localhost:5432/sub_erp' });

async function migrate() {
  await client.connect();
  
  // 1. Change 'Cost of Goods Sold' type to 'COST_OF_REVENUE'
  await client.query(`
    UPDATE docs_accounts 
    SET type = 'COST_OF_REVENUE' 
    WHERE name ILIKE '%Cost of Goods Sold%' OR code = '500101';
  `);
  console.log("Updated Cost of Goods Sold to COST_OF_REVENUE");
  
  // 2. Fetch all unique accounts
  const res = await client.query('SELECT id, type, name, code, company_id FROM docs_accounts ORDER BY type, name;');
  const accounts = res.rows;
  
  // Prefix mapping
  const prefixMap = {
    'ASSET': 1,
    'LIABILITY': 2,
    'EQUITY': 3,
    'REVENUE': 4,
    'COST_OF_REVENUE': 5,
    'EXPENSE': 6,
    'OTHER_REVENUE': 7,
    'OTHER_EXPENSE': 8
  };
  
  // Counters per company per type
  const counters = {};
  
  for (const acc of accounts) {
    const compType = acc.company_id + '_' + acc.type;
    if (!counters[compType]) {
      const prefix = prefixMap[acc.type] || 9;
      counters[compType] = parseInt(prefix + '00000');
    }
    
    counters[compType] += 1;
    let newCode = counters[compType].toString();
    
    // Ensure newCode is 6 characters just in case
    newCode = newCode.padStart(6, '0');
    
    // Update the account
    await client.query('UPDATE docs_accounts SET code = $1 WHERE id = $2;', [newCode, acc.id]);
    console.log(`Updated ${acc.name} (${acc.type}) -> ${newCode}`);
  }
  
  console.log('Done migrating accounts!');
  await client.end();
}

migrate().catch(console.error);
