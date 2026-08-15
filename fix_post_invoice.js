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
  
  // Fix column names
  src = src.replace(/INSERT INTO docs_journals \(id, company_id, date, reference, notes, status, created_by\)/,
                    "INSERT INTO docs_journals (id, company_id, date, reference, description, status, created_by_id)");
                    
  // Let's add explicit checks to see what is NULL
  src = src.replace("VALUES ('JL-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, \n                        v_ar_acc,",
                    "VALUES ('JL-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, \n                        COALESCE(v_ar_acc, 'MISSING-AR'),");
                        
  src = src.replace("VALUES ('JL-' || v_journal_id || '-rev-' || v_idx, v_journal_id, v_effective_company_id, v_rev_acc, 0, v_revenue_net",
                    "VALUES ('JL-' || v_journal_id || '-rev-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_rev_acc, 'MISSING-REV'), 0, v_revenue_net");

  src = src.replace("VALUES ('JL-' || v_journal_id || '-tax-' || v_idx, v_journal_id, v_effective_company_id, v_tax_acc, 0, v_tax_total",
                    "VALUES ('JL-' || v_journal_id || '-tax-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_tax_acc, 'MISSING-TAX'), 0, v_tax_total");

  await client.query(src);
  
  console.log("Updated post_invoice");
  await client.end();
}
main();
