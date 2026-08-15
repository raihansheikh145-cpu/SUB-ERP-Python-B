import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let res = await client.query("SELECT data FROM docs_invoices WHERE id = 'a5c196d5-02b3-427f-bc4e-78e6533017ca'");
  console.log(JSON.stringify(res.rows[0].data, null, 2));
  await client.end();
}
main();
