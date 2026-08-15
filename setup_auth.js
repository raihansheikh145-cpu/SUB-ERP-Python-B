import pkg from 'pg';
const { Client } = pkg;

async function setup() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    console.log('Creating auth_users table...');
    await supaClient.query(`
      CREATE TABLE IF NOT EXISTS public.auth_users (
        id text PRIMARY KEY,
        email text UNIQUE NOT NULL,
        hashed_password text NOT NULL,
        role text DEFAULT 'authenticated',
        is_active boolean DEFAULT true,
        reset_token text,
        reset_token_expires timestamp(3) without time zone,
        approval_token text,
        created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp(3) without time zone
      );
    `);
    
    console.log('Inserting user...');
    // We get the hashed password from the local db for the hotmail user!
    const localClient = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@localhost:5433/postgres?schema=public' });
    await localClient.connect();
    const localRes = await localClient.query('SELECT * FROM public.auth_users WHERE email = $1', ['raihansheikh145@hotmail.com']);
    
    if (localRes.rows.length > 0) {
      const u = localRes.rows[0];
      // Insert with GMAIL email and auth user ID
      await supaClient.query(
        `INSERT INTO public.auth_users (id, email, hashed_password, role, is_active, reset_token, reset_token_expires, approval_token, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO UPDATE SET hashed_password = EXCLUDED.hashed_password`,
        ['0915038d-27d3-441c-b702-ebf2ae411679', 'raihansheikh145@gmail.com', u.hashed_password, u.role, u.is_active, u.reset_token, u.reset_token_expires, u.approval_token, u.created_at, u.updated_at]
      );
      console.log('User inserted successfully in public.auth_users!');
    } else {
      console.log('User not found in local db!');
    }
    await localClient.end();
  } catch (e) {
    console.error(e);
  } finally {
    await supaClient.end();
  }
}

setup();
