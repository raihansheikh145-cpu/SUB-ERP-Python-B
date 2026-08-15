const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT id, journal_type, reference_number, status, description FROM docs_journals WHERE id ILIKE '%919df034%'");
  console.log("Found Journals:", res.rows);
  await client.end();
}
run();
