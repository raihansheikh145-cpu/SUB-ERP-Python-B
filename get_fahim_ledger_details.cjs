const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`
    SELECT jl.id, jl.journal_id, jl.account_id, jl.contact_id, jl.debit, jl.credit 
    FROM docs_journal_lines jl
    WHERE jl.journal_id IN ('JE-LOAN-2494', 'JE-LPAY-5a957f4d-a520-4d6b-83b8-187070e49255-1', '918769e0-7336-4032-913f-a20ddaae7cae')
  `);
  console.log(rows);
  await client.end();
}
run().catch(console.error);
