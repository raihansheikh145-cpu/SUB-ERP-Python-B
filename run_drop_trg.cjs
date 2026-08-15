const { Client } = require('pg');
const fs = require('fs');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const sql = fs.readFileSync('drop_trg.sql', 'utf8');
  await client.query(sql);
  console.log('Successfully dropped triggers');
  await client.end();
}
run();
