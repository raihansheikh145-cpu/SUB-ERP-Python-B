import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT trigger_name, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'docs_contacts';
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
