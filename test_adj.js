import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      INSERT INTO docs_inventory_adjustments (id, company_id, status) VALUES ('test-adj-1', 'comp-4', 'DRAFT') ON CONFLICT DO NOTHING;
      UPDATE docs_inventory_adjustments SET status = 'POSTED' WHERE id = 'test-adj-1';
    `);
    console.log("Adjustment test passed!");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
