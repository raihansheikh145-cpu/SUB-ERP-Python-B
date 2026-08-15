import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres';

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      UPDATE docs_invoices SET status = 'DRAFT' WHERE id IN (SELECT id FROM docs_invoices WHERE status = 'DRAFT' LIMIT 1);
    `);
    console.log("Invoice update passed!");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
