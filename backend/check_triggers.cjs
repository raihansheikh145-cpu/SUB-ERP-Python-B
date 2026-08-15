const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function checkTriggers() {
  await client.connect();

  const tables = ['docs_invoices', 'docs_bills', 'docs_payments', 'docs_journals'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = $1 AND trigger_schema = 'public'
      ORDER BY trigger_name
    `, [t]);
    console.log(`\n=== TRIGGERS on ${t} (${res.rows.length}) ===`);
    res.rows.forEach(r => {
      console.log(`  [${r.action_timing} ${r.event_manipulation}] ${r.trigger_name}`);
      console.log(`    ${r.action_statement.substring(0, 150)}`);
    });
  }

  await client.end();
}
checkTriggers().catch(console.error);
