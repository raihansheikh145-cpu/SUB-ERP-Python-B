import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const supaClient = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await supaClient.connect();
    
    const res = await supaClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'docs_users';
    `);
    console.log('Columns in docs_users:', res.rows.map(r => r.column_name));
    
    // Let's migrate using the correct column names!
    const localClient = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@localhost:5433/postgres?schema=public' });
    await localClient.connect();
    const userRes = await localClient.query('SELECT * FROM docs_users WHERE email = $1', ['raihansheikh145@hotmail.com']);
    
    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      const cols = res.rows.map(r => r.column_name);
      
      const insertCols = [];
      const insertVals = [];
      const insertParams = [];
      
      let i = 1;
      for (const col of cols) {
        if (u[col] !== undefined) {
          insertCols.push(`"${col}"`);
          insertVals.push(u[col]);
          insertParams.push(`$${i++}`);
        }
      }
      
      console.log('Migrating...', insertCols.join(', '));
      await supaClient.query(
        `INSERT INTO docs_users (${insertCols.join(', ')}) VALUES (${insertParams.join(', ')})`,
        insertVals
      );
      console.log('Success!');
    }
    await localClient.end();
  } catch (e) {
    console.error(e.message);
  } finally {
    await supaClient.end();
  }
}

check();
