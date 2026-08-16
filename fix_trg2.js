import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('<SUPABASE_DB_PASSWORD>@', '<SUPABASE_DB_PASSWORD>%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  let res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'trg_sync_cash_ledger_journal'");
  if (res.rows.length > 0) {
    let src = res.rows[0].pg_get_functiondef;
    console.log(src);
  } else {
    console.log("Not found");
  }
  await client.end();
}
main();
