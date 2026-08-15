import pkg from 'pg';
const { Client } = pkg;

async function setup() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    console.log('Adding created_at to docs_users table...');
    await supaClient.query(`
      ALTER TABLE public.docs_users ADD COLUMN IF NOT EXISTS created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP;
    `);
    
    console.log('Successfully added created_at!');
  } catch (e) {
    console.error(e);
  } finally {
    await supaClient.end();
  }
}

setup();
