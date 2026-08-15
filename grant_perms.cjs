const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  console.log('Connected to DB');
  
  try {
    const queries = [
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_invoices TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_bills TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_journals TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_invoice_items TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_bill_items TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_journal_items TO authenticated;'
    ];
    
    for (const q of queries) {
      await client.query(q);
      console.log(`Executed: ${q}`);
    }
    
    console.log('All grants applied successfully.');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
