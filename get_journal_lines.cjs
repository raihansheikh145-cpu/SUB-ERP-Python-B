const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT debit, credit, account_id FROM docs_journal_lines WHERE journal_id = '918769e0-7336-4032-913f-a20ddaae7cae'`);
  console.log(rows);
  await client.end();
}
run();
