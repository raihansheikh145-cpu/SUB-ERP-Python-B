import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    const res = await supaClient.query("SELECT id FROM public.docs_companies WHERE id = 'd9dbb775-6839-4201-9dda-caa39e271201'");
    console.log('Found in docs_companies:', res.rows.length);
  } catch (e) {
    console.error(e);
  } finally {
    await supaClient.end();
  }
}

check();
