import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    console.log('--- AUTH USERS in SUPABASE ---');
    const authUsers = await supaClient.query('SELECT id, email FROM auth.users');
    console.log(authUsers.rows);
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await supaClient.end();
  }
}

check();
