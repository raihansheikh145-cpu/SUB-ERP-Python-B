const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

const fns = [
  'sync_document_metadata',
  'calc_doc_totals',
  'sync_invoice_lines_from_doc_data',
  'sync_bill_lines_from_doc_data',
  'handle_offline_posted_sync',
  'generate_document_numbers',
  'enforce_accounting_immutability',
  'generate_inventory_movements',
];

async function getFns() {
  await client.connect();
  for (const fn of fns) {
    const res = await client.query(
      "SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname=$1 AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') LIMIT 1",
      [fn]
    );
    if (res.rows.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`FUNCTION: ${fn}`);
      console.log('='.repeat(60));
      console.log(res.rows[0].def);
    } else {
      console.log(`\n[NOT FOUND] ${fn}`);
    }
  }
  await client.end();
}
getFns().catch(console.error);
