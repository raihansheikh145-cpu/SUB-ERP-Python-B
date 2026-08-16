import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      UPDATE docs_payments SET status = 'DRAFT' WHERE id IN (SELECT id FROM docs_payments LIMIT 1);
    `);
    console.log("Payment update passed!");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
