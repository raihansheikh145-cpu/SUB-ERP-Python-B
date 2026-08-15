import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let res = await client.query("SELECT id, status FROM docs_payments WHERE id = 'PAY-AUTO-0f15e220-4523-48c6-892c-14c6c848f851'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main();
