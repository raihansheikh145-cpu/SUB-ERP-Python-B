const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT * FROM docs_journals WHERE reference_number LIKE '%2494%'`);
  console.log(rows.map(r => ({id: r.id, ref: r.reference_number, total: r.total})));
  await client.end();
}
run();
