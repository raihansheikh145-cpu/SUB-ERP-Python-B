const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT id, journal_type, reference_number, status, description FROM docs_journals WHERE journal_type = 'BILL' ORDER BY updated_at DESC LIMIT 10");
  console.log("BILLS:", res.rows);
  const res2 = await client.query("SELECT id, bill_number, journal_entry_id FROM docs_bills ORDER BY updated_at DESC LIMIT 5");
  console.log("RECENT BILLS:", res2.rows);
  await client.end();
}
run();
