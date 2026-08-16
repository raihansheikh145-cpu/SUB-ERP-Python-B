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
    // Find a DRAFT invoice
    let res = await client.query("SELECT id, company_id FROM docs_invoices WHERE status = 'DRAFT' LIMIT 1");
    if (res.rows.length === 0) { console.log("No draft invoices"); return; }
    const inv = res.rows[0];
    console.log("Testing invoice:", inv.id);
    await client.query("SELECT post_invoice($1, $2)", [inv.id, inv.company_id]);
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  }
  await client.end();
}
main();
