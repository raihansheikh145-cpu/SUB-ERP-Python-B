import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Client } = pg;
const url = process.env.SUPABASE_DB_URL.replace('<SUPABASE_DB_PASSWORD>', '<SUPABASE_DB_PASSWORD>%40raihan');
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
async function run() {
  await c.connect();
  const res = await c.query("SELECT p.prosrc FROM pg_proc p JOIN pg_trigger t ON t.tgfoid = p.oid WHERE t.tgname = 'trigger_set_invoice_number'");
  console.log(res.rows[0].prosrc);
  await c.end();
}
run();
