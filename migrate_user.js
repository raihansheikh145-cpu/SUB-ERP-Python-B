import pkg from 'pg';
const { Client } = pkg;

async function migrate() {
  const localClient = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@localhost:5433/postgres?schema=public' });
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await localClient.connect();
    await supaClient.connect();
    
    const userRes = await localClient.query('SELECT * FROM docs_users WHERE email = $1', ['raihansheikh145@hotmail.com']);
    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      console.log('Found user in local DB:', u.email);
      
      // Check if it exists in supa
      const supaUserRes = await supaClient.query('SELECT * FROM docs_users WHERE email = $1', [u.email]);
      if (supaUserRes.rows.length === 0) {
        // Insert
        await supaClient.query(
          'INSERT INTO docs_users (id, name, username, email, pin, role_id, status, company_ids, company_id, invitation_token, email_confirmed, user_uuid, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
          [u.id, u.name, u.username, u.email, u.pin, u.role_id, u.status, u.company_ids, u.company_id, u.invitation_token, u.email_confirmed, u.user_uuid, u.created_at, u.updated_at]
        );
        console.log('Migrated docs_users!');
      } else {
        console.log('User already in Supabase docs_users!');
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await localClient.end();
    await supaClient.end();
  }
}

migrate();
