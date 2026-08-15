const fs = require('fs');
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(
    "SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname='post_payment' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') LIMIT 1"
  );
  if (res.rows.length > 0) {
    fs.writeFileSync('backend/payment_fn_dump.txt', res.rows[0].def);
    console.log('Dumped successfully');
  } else {
    console.log('Function post_payment not found');
  }
  await client.end();
}

run().catch(console.error);
