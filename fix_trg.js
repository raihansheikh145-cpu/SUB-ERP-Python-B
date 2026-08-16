import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('<SUPABASE_DB_PASSWORD>@', '<SUPABASE_DB_PASSWORD>%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  let res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'trg_sync_cash_ledger'");
  let src = res.rows[0].pg_get_functiondef;
  
  src = src.replace(/SELECT type INTO v_account_id FROM docs_accounts WHERE id = NEW.account_id LIMIT 1;/,
                    "SELECT code, type INTO v_account_id, v_is_cash FROM docs_accounts WHERE id = NEW.account_id LIMIT 1;");

  await client.query(src);
  
  console.log("Updated trg_sync_cash_ledger");
  await client.end();
}
main();
