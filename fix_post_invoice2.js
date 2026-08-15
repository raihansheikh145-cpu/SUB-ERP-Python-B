import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  let res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'post_invoice'");
  let src = res.rows[0].pg_get_functiondef;
  
  src = src.replace(/UPDATE docs_invoices SET status = 'POSTED', data = jsonb_set\(COALESCE\(data, '\{\}'::jsonb\), '\{status\}', to_jsonb\('POSTED'::text\)\) WHERE id = p_invoice_id AND status = 'DRAFT';/,
                    "UPDATE docs_invoices SET status = 'POSTED', journal_entry_id = v_journal_id, data = jsonb_set(jsonb_set(COALESCE(data, '{}'::jsonb), '{status}', to_jsonb('POSTED'::text)), '{journalEntryId}', to_jsonb(v_journal_id::text)) WHERE id = p_invoice_id AND status = 'DRAFT';");

  await client.query(src);
  
  console.log("Updated post_invoice journal_entry_id");
  await client.end();
}
main();
