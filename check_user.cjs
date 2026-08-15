const pkg = require('pg');
const client = new pkg.Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  return client.query("SELECT email, company_ids FROM public.docs_users WHERE email = 'raihansheikh145@gmail.com'");
}).then(res => {
  console.log('User:', JSON.stringify(res.rows, null, 2));
  client.end();
});
