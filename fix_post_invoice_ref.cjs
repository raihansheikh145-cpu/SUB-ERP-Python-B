const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  
  const { rows } = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'post_invoice'`);
  let src = rows[0].prosrc;
  
  // modify INSERT INTO docs_journals
  src = src.replace(
    /INSERT INTO docs_journals \(id, company_id, date, reference, description, status, created_by_id, journal_type, data\)/,
    "INSERT INTO docs_journals (id, company_id, date, reference, reference_number, description, status, created_by_id, journal_type, data)"
  );
  
  src = src.replace(
    /VALUES \(v_journal_id, v_effective_company_id, v_invoice\.date, COALESCE\(v_invoice\.invoice_number, v_invoice\.id\), 'Invoice ' \|\|/,
    "VALUES (v_journal_id, v_effective_company_id, v_invoice.date, COALESCE(v_invoice.invoice_number, v_invoice.id), COALESCE(v_invoice.invoice_number, v_invoice.id), 'Invoice ' ||"
  );
  
  src = src.replace(
    /ON CONFLICT \(id\) DO UPDATE SET date = EXCLUDED\.date, reference = EXCLUDED\.reference,/,
    "ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, reference = EXCLUDED.reference, reference_number = EXCLUDED.reference_number,"
  );
  
  await client.query(`CREATE OR REPLACE FUNCTION public.post_invoice(p_invoice_id text, p_company_id text DEFAULT NULL::text)\n RETURNS jsonb\n LANGUAGE plpgsql\nAS $function$\n${src}\n$function$;`);
  
  // also fix existing journals
  await client.query(`UPDATE docs_journals SET reference_number = reference WHERE journal_type = 'INV' AND reference IS NOT NULL AND reference_number LIKE 'JE-%'`);
  
  await client.end();
  console.log("Fixed post_invoice and updated existing journals");
}
run();
