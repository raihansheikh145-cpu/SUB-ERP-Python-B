const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  console.log('Connected to DB');
  
  try {
    const checkQuery = `SELECT * FROM public.users WHERE email = 'raihansheikh145@gmail.com'`;
    const checkRes = await client.query(checkQuery);
    
    if (checkRes.rows.length === 0) {
      const insertQuery = `
        INSERT INTO public.users (id, email, role, created_at)
        VALUES (gen_random_uuid(), 'raihansheikh145@gmail.com', 'admin', NOW())
      `;
      await client.query(insertQuery);
      console.log("User 'raihansheikh145@gmail.com' inserted as Admin.");
    } else {
      console.log("User already exists in public.users table.");
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
