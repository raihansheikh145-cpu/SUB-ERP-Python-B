const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  const res = await client.query("SELECT data->>'type' as type FROM docs_accounts WHERE data->>'code' = '500101'");
  console.log('CURRENT:', res.rows);
  
  await client.query("UPDATE docs_accounts SET data = jsonb_set(data::jsonb, '{type}', '\"COST_OF_REVENUE\"') WHERE data->>'code' = '500101'");
  
  const res2 = await client.query("SELECT data->>'type' as type FROM docs_accounts WHERE data->>'code' = '500101'");
  console.log('UPDATED:', res2.rows);

  client.end();
});
