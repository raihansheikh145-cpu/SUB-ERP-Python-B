import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const url = process.env.SUPABASE_DB_URL.replace('<SUPABASE_DB_PASSWORD>', '<SUPABASE_DB_PASSWORD>%40raihan');
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  await c.connect();
  const res = await c.query("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'docs_invoices'::regclass AND i.indisprimary");
  console.log(res.rows);
  const res2 = await c.query("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'docs_invoices'::regclass AND i.indisunique");
  console.log(res2.rows);
  await c.end();
}
run();
