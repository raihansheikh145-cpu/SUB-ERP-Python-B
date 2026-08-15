import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  try {
    await client.connect();
    
    console.log('--- BILLS in SUPABASE ---');
    const billsRes = await client.query('SELECT id, data FROM docs_bills');
    console.log(billsRes.rows.map(b => b.data.company_id));
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}

check();
