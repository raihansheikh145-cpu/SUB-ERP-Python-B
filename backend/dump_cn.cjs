const fs = require('fs');
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  let content = "";
  
  const res1 = await client.query(
    "SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname='post_credit_note' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') LIMIT 1"
  );
  if (res1.rows.length > 0) content += res1.rows[0].def + "\n\n";
  
  const res2 = await client.query(
    "SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname='process_credit_note' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') LIMIT 1"
  );
  if (res2.rows.length > 0) content += res2.rows[0].def + "\n\n";

  fs.writeFileSync('backend/credit_note_fn_dump.txt', content);
  await client.end();
}

run().catch(console.error);
