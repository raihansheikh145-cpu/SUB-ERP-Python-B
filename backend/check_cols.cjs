const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function checkCols() {
  await client.connect();
  const tables = ['docs_loans', 'docs_payslips', 'docs_leaves', 'docs_tasks'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [t]);
    console.log(`\n=== ${t} ===`);
    res.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
  }
  await client.end();
}
checkCols().catch(console.error);
