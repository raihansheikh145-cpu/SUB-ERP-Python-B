const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function analyzeJsonKeys() {
  await client.connect();

  const tables = [
    { name: 'docs_invoices', keep: ['items', 'messages'] },
    { name: 'docs_bills', keep: ['items'] },
    { name: 'docs_payments', keep: ['appliedInvoices', 'appliedBills', 'appliedBillIds', 'appliedInvoiceIds'] },
    { name: 'docs_journals', keep: [] },
    { name: 'docs_accounts', keep: ['*'] }, // keep everything in accounts
  ];

  for (const t of tables) {
    const hasData = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=$1 AND column_name='data'
    `, [t.name]);
    if (hasData.rows.length === 0) { console.log(`\n[${t.name}] — no data column`); continue; }

    // Get all keys from data jsonb across all rows
    const keys = await client.query(`
      SELECT DISTINCT key 
      FROM ${t.name}, jsonb_object_keys(data) AS key
      ORDER BY key
    `);

    const allKeys = keys.rows.map(r => r.key);
    const toRemove = t.keep[0] === '*' ? [] : allKeys.filter(k => !t.keep.includes(k));
    const toKeep = t.keep[0] === '*' ? allKeys : t.keep.filter(k => allKeys.includes(k));

    console.log(`\n===== ${t.name} =====`);
    console.log(`  ALL KEYS (${allKeys.length}):  ${allKeys.join(', ')}`);
    console.log(`  KEEP (${toKeep.length}):   ${toKeep.join(', ')}`);
    console.log(`  REMOVE (${toRemove.length}): ${toRemove.join(', ')}`);
  }

  await client.end();
}

analyzeJsonKeys().catch(console.error);
