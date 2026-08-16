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
      WHERE proname = 'generate_inventory_movements';
    `);
    let sql = res.rows[0].prosrc;
    
    sql = sql.replace(
      "IF NEW.status IS NOT DISTINCT FROM OLD.status\\n          AND NEW.date IS NOT DISTINCT FROM OLD.date\\n          AND NEW.data IS NOT DISTINCT FROM OLD.data\\n          AND NEW.subtotal IS NOT DISTINCT FROM OLD.subtotal THEN",
      "IF (to_jsonb(NEW) ->> 'status') IS NOT DISTINCT FROM (to_jsonb(OLD) ->> 'status')\\n          AND NEW.data IS NOT DISTINCT FROM OLD.data THEN"
    );
    
    // Also replace other instances of NEW.date and NEW.subtotal that might fail on adj
    // e.g. COALESCE(NEW.date, NOW()::DATE)
    // Wait, docs_inventory_adjustments does NOT have NEW.date
    // The code says: COALESCE(NULLIF(v_data->>'date', '')::DATE, NEW.updated_at::DATE, NOW()::DATE)
    // For invoices: COALESCE(NEW.date, NOW()::DATE) -- docs_invoices HAS date
    // For bills: COALESCE(NEW.date, NOW()::DATE) -- docs_bills HAS date
    // For credit notes: COALESCE(NEW.date, NOW()::DATE) -- docs_credit_notes HAS date
    
    // Let's just update the function definition!
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_inventory_movements() RETURNS TRIGGER AS $$
      ${sql}
      $$ LANGUAGE plpgsql;
    `);
    
    console.log("generate_inventory_movements fixed!");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
