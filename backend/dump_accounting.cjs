const fs = require('fs');
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const fns = ['post_invoice', 'post_bill'];
  let output = '';
  for (const fn of fns) {
    const res = await client.query(
      "SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname=$1 AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') LIMIT 1",
      [fn]
    );
    if (res.rows.length > 0) {
      output += `\n--- FUNCTION: ${fn} ---\n${res.rows[0].def}\n`;
    }
  }
  fs.writeFileSync('backend/accounting_fns_dump.txt', output);
  console.log('Dumped successfully');
  await client.end();
}

run().catch(console.error);
