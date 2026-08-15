const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table IN ('docs_invoices', 'docs_bills', 'docs_payments', 'docs_credit_notes')
    AND trigger_name LIKE '%ledger%'
  `);
  console.log(res.rows);
  await client.end();
}
run();
