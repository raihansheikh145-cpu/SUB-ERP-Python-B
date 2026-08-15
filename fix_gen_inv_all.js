import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres';

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
    
    // Replace NEW.date with NULLIF(to_jsonb(NEW)->>'date', '')::DATE
    sql = sql.replace(/NEW\.date/g, "(NULLIF(to_jsonb(NEW)->>'date', '')::DATE)");
    sql = sql.replace(/OLD\.date/g, "(NULLIF(to_jsonb(OLD)->>'date', '')::DATE)");
    
    sql = sql.replace(/NEW\.subtotal/g, "(NULLIF(to_jsonb(NEW)->>'subtotal', '')::NUMERIC)");
    sql = sql.replace(/OLD\.subtotal/g, "(NULLIF(to_jsonb(OLD)->>'subtotal', '')::NUMERIC)");

    sql = sql.replace(/NEW\.discount_total/g, "(NULLIF(to_jsonb(NEW)->>'discount_total', '')::NUMERIC)");

    await client.query(`
      CREATE OR REPLACE FUNCTION generate_inventory_movements() RETURNS TRIGGER AS $$
      ${sql}
      $$ LANGUAGE plpgsql;
    `);
    console.log("Replaced NEW.date and NEW.subtotal successfully!");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
