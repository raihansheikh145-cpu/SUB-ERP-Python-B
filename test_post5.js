import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('<SUPABASE_DB_PASSWORD>@', '<SUPABASE_DB_PASSWORD>%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let res = await client.query("SELECT id, account_id, credit FROM docs_journal_lines WHERE journal_id = 'JE-0F15E220-4523-48C6-892C-14C6C848F851'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main();
