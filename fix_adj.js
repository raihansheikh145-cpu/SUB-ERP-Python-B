import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres';

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      DROP TRIGGER IF EXISTS trg_sync_docs_inventory_adjustments_doc ON docs_inventory_adjustments;
    `);
    console.log("Dropped sync trigger from docs_inventory_adjustments");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
