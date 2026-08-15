const { Client } = require('pg');
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const dbUrl = envFile.match(/DATABASE_URL=(.*)/)[1];
const client = new Client({ connectionString: dbUrl });
async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'docs_loans';");
  console.log(res.rows);
  await client.end();
}
run();
