import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    const res = await supaClient.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'docs_bills'");
    console.log('Columns in docs_bills:', res.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e);
  } finally {
    await supaClient.end();
  }
}

check();
