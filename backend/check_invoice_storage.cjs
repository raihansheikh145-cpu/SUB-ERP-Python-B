const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();

  // 1. Show actual columns of docs_invoices
  console.log('\n===== docs_invoices TABLE COLUMNS =====');
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'docs_invoices'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(r => console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`));

  // 2. Show one real invoice row
  console.log('\n===== ONE REAL INVOICE ROW =====');
  const inv = await client.query(`SELECT * FROM public.docs_invoices LIMIT 1`);
  if (inv.rows.length > 0) {
    const row = inv.rows[0];
    for (const [key, val] of Object.entries(row)) {
      const display = val === null ? 'NULL' : 
                      typeof val === 'object' ? JSON.stringify(val).substring(0, 120) + '...' :
                      String(val).substring(0, 120);
      console.log(`  ${key.padEnd(30)} = ${display}`);
    }
  }

  // 3. Show actual columns of docs_invoice_lines
  console.log('\n===== docs_invoice_lines TABLE COLUMNS =====');
  const lineCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'docs_invoice_lines'
    ORDER BY ordinal_position
  `);
  lineCols.rows.forEach(r => console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`));

  // 4. Show one real invoice line row
  console.log('\n===== ONE REAL INVOICE LINE ROW =====');
  const line = await client.query(`SELECT * FROM public.docs_invoice_lines LIMIT 1`);
  if (line.rows.length > 0) {
    const row = line.rows[0];
    for (const [key, val] of Object.entries(row)) {
      const display = val === null ? 'NULL' : 
                      typeof val === 'object' ? JSON.stringify(val).substring(0, 120) + '...' :
                      String(val).substring(0, 120);
      console.log(`  ${key.padEnd(30)} = ${display}`);
    }
  }

  await client.end();
}

check().catch(console.error);
