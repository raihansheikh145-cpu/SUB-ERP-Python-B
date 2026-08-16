import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'post_bill';
    `);
    let sql = res.rows[0].prosrc;
    
    // Make sure we resolve the journal id strictly
    sql = sql.replace(
        "SELECT id INTO v_journal_id FROM docs_journals \n     WHERE (journal_number = v_bill_number OR reference_number = v_bill_number) AND company_id = p_company_id LIMIT 1;",
        `
        SELECT id INTO v_journal_id FROM docs_journals 
        WHERE (reference_number = v_bill_number) AND company_id = p_company_id LIMIT 1;
        `
    );
    
    // also let's use an ON CONFLICT just in case
    sql = sql.replace(
        `INSERT INTO docs_journals (
            id, company_id, date, journal_date, reference_number, journal_number, journal_type, status, description, updated_at
        )
        VALUES (
            v_journal_id, p_company_id, v_bill.date, v_bill.date, v_bill_number, v_bill_number, 'BILL', 'POSTED', 'Bill: ' || v_bill_number, NOW()
        );`,
        `INSERT INTO docs_journals (
            id, company_id, date, journal_date, reference_number, journal_number, journal_type, status, description, updated_at
        )
        VALUES (
            v_journal_id, p_company_id, v_bill.date, v_bill.date, v_bill_number, v_bill_number, 'BILL', 'POSTED', 'Bill: ' || v_bill_number, NOW()
        ) ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW(), reference_number = EXCLUDED.reference_number, journal_number = EXCLUDED.journal_number;`
    );

    await client.query(`
      CREATE OR REPLACE FUNCTION post_bill(p_bill_id text, p_company_id text) RETURNS jsonb AS $$
      ${sql}
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    const billsRes = await client.query(`SELECT id, company_id FROM docs_bills WHERE status IN ('POSTED', 'PAID', 'PARTIAL')`);
    for (const row of billsRes.rows) {
      try {
        await client.query('SELECT post_bill($1, $2)', [row.id, row.company_id]);
      } catch (e) {
        console.error("Failed bill:", row.id, e.message);
      }
    }
    console.log(`Re-posted ${billsRes.rows.length} bills.`);
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
