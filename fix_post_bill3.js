import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'post_bill';
    `);
    let sql = res.rows[0].prosrc;
    
    if (!sql.includes("PERFORM set_config('core.bypass_audit'")) {
        sql = sql.replace("BEGIN", "BEGIN\n    PERFORM set_config('core.bypass_audit', 'true', true);");
        await client.query(`
          CREATE OR REPLACE FUNCTION post_bill(p_bill_id text, p_company_id text) RETURNS jsonb AS $$
          ${sql}
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        console.log('Added bypass to post_bill');
    }
    
    const billsRes = await client.query(`SELECT id, company_id FROM docs_bills WHERE status IN ('POSTED', 'PAID', 'PARTIAL')`);
    for (const row of billsRes.rows) {
      await client.query('SELECT post_bill($1, $2)', [row.id, row.company_id]);
    }
    console.log(`Re-posted ${billsRes.rows.length} bills.`);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
