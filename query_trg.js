import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let res = await client.query("SELECT prosrc FROM pg_proc WHERE proname IN ('check_journal_balance', 'trg_sync_cash_ledger', 'verify_double_entry_integrity', 'verify_journal_line_partner_constraint')");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main();
