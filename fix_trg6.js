import pg from 'pg';
import fs from 'fs';
async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const dbUrlMatch = env.match(/SUPABASE_DB_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No db url");
  const url = dbUrlMatch[1].trim().replace(/^"|"$/g, '').replace('sk445@raihan@', 'sk445%40raihan@');
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  await client.query(`
    UPDATE docs_journals j 
    SET status = 'DRAFT' 
    FROM docs_invoices i 
    WHERE i.journal_entry_id = j.id AND i.status = 'DRAFT';
    
    UPDATE docs_journals j 
    SET status = 'DRAFT' 
    FROM docs_bills b 
    WHERE b.journal_entry_id = j.id AND b.status = 'DRAFT';
  `);
  
  console.log("Fixed draft journals");
  await client.end();
}
main();
