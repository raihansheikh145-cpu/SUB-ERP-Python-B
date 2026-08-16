import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('<SUPABASE_DB_PASSWORD>@', '<SUPABASE_DB_PASSWORD>%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const invId = '0f15e220-4523-48c6-892c-14c6c848f851';
    console.log("Testing invoice:", invId);
    await client.query("SELECT post_invoice($1, 'comp-1')", [invId]);
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  }
  await client.end();
}
main();
