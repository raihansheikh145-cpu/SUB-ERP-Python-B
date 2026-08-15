const fs = require('fs');
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query("DROP FUNCTION IF EXISTS public.create_credit_note(jsonb)");
    await client.query("DROP FUNCTION IF EXISTS public.process_credit_note(jsonb)");
    await client.query("DROP FUNCTION IF EXISTS public.post_credit_note(text, text)");
    console.log("Successfully dropped legacy credit note RPC functions.");
  } catch(e) {
    console.error("Error dropping functions:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
