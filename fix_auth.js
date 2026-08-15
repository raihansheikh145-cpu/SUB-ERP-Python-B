import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    const email = 'raihansheikh145@gmail.com';
    const password = '87654321'; 
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    const res = await supaClient.query(
      'UPDATE auth.users SET encrypted_password = $1 WHERE email = $2',
      [hash, email]
    );
    console.log('Rows updated to 87654321:', res.rowCount);
  } catch (e) {
    console.error(e.message);
  } finally {
    await supaClient.end();
  }
}

fix();
