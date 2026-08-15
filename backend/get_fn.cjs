const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'post_invoice'");
    if (res.rows.length > 0) {
        console.log(res.rows[0].pg_get_functiondef);
    } else {
        console.log("FUNCTION NOT FOUND IN DB");
    }
  } catch (e) {
    console.log(e);
  }
  client.end();
});
