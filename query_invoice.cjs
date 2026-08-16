const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT id, reference_number, data->>'number' as num, data->>'invoiceNumber' as inv_num FROM docs_journals WHERE id = 'INV-JE-0C5C66C5-E8CC-487E-A406-B3BEAE32FEB7' OR reference_number = 'INV-JE-0C5C66C5-E8CC-487E-A406-B3BEAE32FEB7'`);
  console.log('Journal:', rows);
  
  const { rows: invRows } = await client.query(`SELECT id, invoice_number, data->>'number' as num, data->>'invoiceNumber' as inv_num FROM docs_invoices WHERE id = '0C5C66C5-E8CC-487E-A406-B3BEAE32FEB7' OR id ILIKE '%0C5C66C5-E8CC-487E-A406-B3BEAE32FEB7%'`);
  console.log('Invoice:', invRows);
  
  await client.end();
}
run();
