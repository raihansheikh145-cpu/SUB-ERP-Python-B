const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT id, data FROM docs_loans`);
  for (const row of rows) {
    const data = row.data;
    const pp = data.paidPeriods || data.paid_periods;
    if (pp && Array.isArray(pp) && pp.length > 0) {
      const ppStr = pp.map(String);
      const ppSqlArray = `{${ppStr.join(',')}}`;
      await client.query(`UPDATE docs_loans SET paid_periods = $1 WHERE id = $2`, [ppStr, row.id]);
      console.log(`Updated loan ${row.id} with paid_periods = ${ppStr}`);
    }
  }
  await client.end();
}
run();
