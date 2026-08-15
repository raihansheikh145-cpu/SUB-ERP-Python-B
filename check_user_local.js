import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres:sk445%40raihan@localhost:5433/postgres?schema=public', 
  });
  try {
    await client.connect();
    
    console.log('--- USER in LOCAL ---');
    const userRes = await client.query('SELECT * FROM docs_users WHERE email = $1', ['raihansheikh145@hotmail.com']);
    if (userRes.rows.length > 0) {
      console.log(userRes.rows[0]);
    } else {
      console.log('User not found in local!');
    }
    
    const allUsers = await client.query('SELECT email FROM docs_users');
    console.log('All users in local:', allUsers.rows);

    const billsRes = await client.query('SELECT count(*) FROM docs_bills');
    console.log('Total bills in local:', billsRes.rows[0].count);
    
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}

check();
