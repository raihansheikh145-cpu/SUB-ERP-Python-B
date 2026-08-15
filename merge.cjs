const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:123456@localhost:5432/sub_erp' });

async function mergeAccounts() {
  await client.connect();
  
  const targetId = 'acc-cogs-d9dbb775-6839-4201-9dda-caa39e271201';
  const duplicateId = 'd9dbb775-6839-4201-9dda-caa39e271201-500101';
  
  // 1. Move journal lines
  const res1 = await client.query('UPDATE docs_journal_lines SET account_id = $1 WHERE account_id = $2;', [targetId, duplicateId]);
  console.log('Moved lines:', res1.rowCount);
  
  // 2. Delete the duplicate account
  const res2 = await client.query('DELETE FROM docs_accounts WHERE id = $1;', [duplicateId]);
  console.log('Deleted duplicate account:', res2.rowCount);
  
  await client.end();
}

mergeAccounts().catch(console.error);
