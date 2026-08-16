import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';

const tables = [
  'docs_accounts', 'docs_contacts', 'docs_products', 
  'docs_roles', 'docs_categories', 'docs_brands'
];

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const table of tables) {
      await client.query(`DROP TRIGGER IF EXISTS trg_sync_${table}_doc ON ${table};`);
      console.log(`Dropped sync trigger from ${table}`);
    }
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
