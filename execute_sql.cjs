const { Client } = require('pg');
const fs = require('fs');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const sql = fs.readFileSync('fix_ledger_v3.sql', 'utf8');
  await client.query(sql);
  console.log('Successfully updated general ledger RPC');
  await client.end();
}
run();
