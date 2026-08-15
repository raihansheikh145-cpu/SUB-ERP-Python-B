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
    -- Just re-trigger updates for posted journals to populate the cash ledger
    UPDATE docs_journals SET status = 'POSTED' WHERE status = 'POSTED' AND id IN (
       SELECT DISTINCT journal_id FROM docs_journal_lines WHERE account_id IN (SELECT id FROM docs_accounts WHERE code IN ('100100', '1011') OR type IN ('CASH', 'BANK'))
    );
  `);
  
  console.log("Updated cash ledger entries");
  await client.end();
}
main();
