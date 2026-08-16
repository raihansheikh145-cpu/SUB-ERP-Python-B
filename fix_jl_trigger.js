import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`DROP TRIGGER IF EXISTS trg_docs_journal_lines_cash_ledger ON docs_journal_lines;`);
    console.log("Dropped the bad trigger on docs_journal_lines.");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
