import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    const res = await supaClient.query('SELECT id, email, encrypted_password, email_confirmed_at, raw_user_meta_data FROM auth.users WHERE email = $1', ['raihansheikh145@gmail.com']);
    console.log(res.rows[0]);
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await supaClient.end();
  }
}

check();
