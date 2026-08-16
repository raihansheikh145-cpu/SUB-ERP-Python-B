import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // Disable triggers temporarily
    await client.query("ALTER TABLE docs_bills DISABLE TRIGGER ALL");
    await client.query("ALTER TABLE docs_journals DISABLE TRIGGER ALL");
    
    const res = await client.query(`SELECT id, company_id FROM docs_bills WHERE status IN ('POSTED', 'PAID', 'PARTIAL')`);
    for (const row of res.rows) {
      await client.query('SELECT post_bill($1, $2)', [row.id, row.company_id]);
    }
    console.log(`Re-posted ${res.rows.length} bills.`);
    
    // Re-enable triggers
    await client.query("ALTER TABLE docs_bills ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE docs_journals ENABLE TRIGGER ALL");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
