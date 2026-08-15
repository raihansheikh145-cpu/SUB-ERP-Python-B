import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  let res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'trg_sync_cash_ledger_journal'");
  let src = res.rows[0].pg_get_functiondef;
  
  src = src.replace(/al\.account_id = \(SELECT id FROM docs_accounts WHERE \(code = '100100' OR sub_type IN \('CASH', 'BANK'\)\) LIMIT 1\)/g,
                    "al.account_id IN (SELECT id FROM docs_accounts WHERE code IN ('100100', '1011') OR type IN ('CASH', 'BANK'))");

  await client.query(src);
  
  console.log("Updated trg_sync_cash_ledger_journal");
  await client.end();
}
main();
