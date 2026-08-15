import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    console.log('Changing company_ids to JSONB');
    await supaClient.query(`
      ALTER TABLE public.docs_users ALTER COLUMN company_ids DROP DEFAULT;
      ALTER TABLE public.docs_users ALTER COLUMN company_ids TYPE jsonb USING to_jsonb(company_ids);
      ALTER TABLE public.docs_users ALTER COLUMN company_ids SET DEFAULT '[]'::jsonb;
    `);
    
    console.log('Successfully changed company_ids to JSONB!');
  } catch (e) {
    console.error(e);
  } finally {
    await supaClient.end();
  }
}

check();
