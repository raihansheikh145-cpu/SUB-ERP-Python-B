const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT id, journal_type, reference_number, status, description FROM docs_journals WHERE journal_type = 'BILL' OR journal_type = 'INV' ORDER BY updated_at DESC LIMIT 10");
  console.log(res.rows);
  await client.end();
}
run();
