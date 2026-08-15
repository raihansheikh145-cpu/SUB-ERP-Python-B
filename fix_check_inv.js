import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  let res = await client.query(`SELECT id, company_id, invoice_number FROM docs_invoices WHERE invoice_number ILIKE '%e8d4%'`);
  console.log(res.rows);
  if (res.rows.length > 0) {
      const invId = res.rows[0].id;
      const compId = res.rows[0].company_id;
      try {
          await client.query(`SELECT post_invoice($1, $2)`, [invId, compId]);
          console.log("Success");
      } catch (e) {
          console.log("Error posting:", e.message);
      }
  }
  
  await client.end();
}
main();
