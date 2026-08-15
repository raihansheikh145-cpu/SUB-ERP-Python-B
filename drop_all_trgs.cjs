const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`
    SELECT event_object_table, trigger_name 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
  `);
  
  for (const row of res.rows) {
    const query = `DROP TRIGGER IF EXISTS ${row.trigger_name} ON "${row.event_object_table}" CASCADE`;
    try {
      await client.query(query);
      console.log(`Dropped ${row.trigger_name} on ${row.event_object_table}`);
    } catch (e) {
      console.error(`Failed to drop ${row.trigger_name} on ${row.event_object_table}: ${e.message}`);
    }
  }
  console.log('Successfully dropped all triggers on public schema.');
  await client.end();
}
run();
