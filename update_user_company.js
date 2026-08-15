import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    // First, select the user to check company_id
    const res = await supaClient.query("SELECT company_id, company_ids FROM public.docs_users WHERE email = 'raihansheikh145@gmail.com'");
    console.log('User before:', res.rows[0]);
    
    if (res.rows[0] && res.rows[0].company_id) {
        const cId = res.rows[0].company_id;
        
        // Update company_ids to include this company_id
        await supaClient.query(`
            UPDATE public.docs_users 
            SET company_ids = $1::jsonb 
            WHERE email = 'raihansheikh145@gmail.com'
        `, [JSON.stringify([cId])]);
        
        console.log('Successfully updated company_ids!');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await supaClient.end();
  }
}

check();
