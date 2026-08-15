const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("UPDATE public.auth_users SET role = 'role-superadmin' WHERE role = 'authenticated'").then(res => {
    console.log('UPDATED:', res.rowCount);
    client.end();
  });
});
