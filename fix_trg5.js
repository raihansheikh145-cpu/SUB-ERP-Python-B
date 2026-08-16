import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('<SUPABASE_DB_PASSWORD>@', '<SUPABASE_DB_PASSWORD>%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  await client.query(`
    UPDATE docs_journals SET status = 'DRAFT' WHERE status = 'POSTED';
    UPDATE docs_journals SET status = 'POSTED' WHERE status = 'DRAFT';
  `);
  
  console.log("Updated cash ledger entries");
  await client.end();
}
main();
