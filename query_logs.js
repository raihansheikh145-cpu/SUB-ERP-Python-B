import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const url = process.env.SUPABASE_DB_URL.replace('<SUPABASE_DB_PASSWORD>', '<SUPABASE_DB_PASSWORD>%40raihan');
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  await c.connect();
  const res = await c.query("SELECT * FROM pg_indexes WHERE tablename = 'docs_invoices'");
  console.log(res.rows);
  await c.end();
}
run();
