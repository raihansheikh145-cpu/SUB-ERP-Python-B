const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'docs_bills'");
  console.log(res.rows.map(r=>r.column_name));
  await client.end();
}
run();
