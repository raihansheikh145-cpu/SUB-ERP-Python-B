const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`
    SELECT jl.id, jl.journal_id, j.status, jl.debit, jl.credit 
    FROM docs_journal_lines jl
    JOIN docs_journals j ON jl.journal_id = j.id
    WHERE jl.contact_id = 'f751fbcf-e6f9-4399-aa69-50d492055ea4'
  `);
  console.log(rows);
  await client.end();
}
run().catch(console.error);
