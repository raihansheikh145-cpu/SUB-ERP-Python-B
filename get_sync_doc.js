import fs from 'fs';
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
      WHERE proname = 'sync_document_metadata';
    `);
    fs.writeFileSync('sync_doc.sql', res.rows[0].prosrc);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
