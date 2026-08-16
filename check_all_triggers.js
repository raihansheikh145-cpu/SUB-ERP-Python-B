import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT tgrelid::regclass as table_name, tgname as trigger_name 
      FROM pg_trigger 
      WHERE tgname ILIKE '%immutable%';
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
