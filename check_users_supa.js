import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  try {
    await client.connect();
    
    console.log('--- USERS in SUPABASE ---');
    const allUsers = await client.query('SELECT email, name FROM docs_users');
    console.log(allUsers.rows);

    const billsRes = await client.query('SELECT count(*) FROM docs_bills');
    console.log('Total bills in supabase:', billsRes.rows[0].count);
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}

check();
