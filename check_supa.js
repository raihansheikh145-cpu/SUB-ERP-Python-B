import pkg from 'pg';
const { Client } = pkg;

async function check(name, connectionString) {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM docs_bills');
    console.log(`${name} Bills: ${res.rows[0].count}`);
  } catch (e) {
    console.error(`${name} Error:`, e.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await check('Supabase (env)', 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres');
  await check('Supabase (old)', 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres');
  await check('Local', 'postgresql://postgres:sk445%40raihan@localhost:5433/postgres?schema=public');
}
main();
