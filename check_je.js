import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`SELECT * FROM docs_journal_lines WHERE journal_id = 'JE-49E2444CCA2240788555097A19611987'`);
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
