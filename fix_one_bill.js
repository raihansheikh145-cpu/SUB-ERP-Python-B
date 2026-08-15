import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(`SELECT id, company_id FROM docs_bills WHERE bill_number = 'BIL-SUL-000393'`);
    if (res.rows.length > 0) {
        const row = res.rows[0];
        console.log("Found bill:", row.id);
        const postRes = await client.query('SELECT post_bill($1, $2)', [row.id, row.company_id]);
        console.log("Post bill result:", postRes.rows[0]);
    } else {
        console.log("Bill not found by bill_number, checking data->>'number'...");
        const res2 = await client.query(`SELECT id, company_id FROM docs_bills WHERE data->>'number' = 'BIL-SUL-000393'`);
        if (res2.rows.length > 0) {
            const row = res2.rows[0];
            console.log("Found bill via data->number:", row.id);
            const postRes = await client.query('SELECT post_bill($1, $2)', [row.id, row.company_id]);
            console.log("Post bill result:", postRes.rows[0]);
        }
    }
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
