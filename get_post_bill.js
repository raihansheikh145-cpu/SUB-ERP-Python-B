import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'post_bill';
    `);
    console.log(res.rows[0]?.prosrc);
  } catch (e) {
    console.log(e.message);
  }
  await client.end();
}
main();
