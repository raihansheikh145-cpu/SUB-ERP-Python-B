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
    const funcs = [
      "post_invoice(text, text)",
      "process_invoice(jsonb)",
      "post_bill(text, text)",
      "process_bill(jsonb)",
      "post_payment(text, text)",
      "process_payment(jsonb)",
      "register_batch_payment(jsonb)",
      "post_credit_note(text, text)",
      "process_credit_note(jsonb)",
      "create_credit_note(jsonb)",
      "create_journal_entry(jsonb, uuid)",
      "reverse_journal_entry(uuid, uuid)",
      "process_partner_discount(uuid, numeric, text, text, uuid)",
      
      // Trigger functions ( CASCADE to remove triggers from tables )
      "generate_inventory_movements()",
      "sync_invoice_lines_from_doc_data()",
      "sync_bill_lines_from_doc_data()",
      "generate_document_numbers()",
      "calc_doc_totals()"
    ];

    for (const func of funcs) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS public.${func} CASCADE`);
        console.log(`Dropped ${func}`);
      } catch (e) {
        console.log(`Error dropping ${func}:`, e.message);
      }
    }
    console.log("Final database cleanup successful.");
  } catch(e) {
    console.error("Critical error:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
