const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT id, data FROM docs_loans WHERE data->>'number' = 'LOAN-2494'`);
  console.log(JSON.stringify(rows, null, 2));
  await client.end();
}
run().catch(console.error);
