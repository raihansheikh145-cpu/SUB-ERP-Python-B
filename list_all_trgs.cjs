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
    ORDER BY event_object_table, trigger_name
  `);
  const triggers = res.rows;
  const grouped = {};
  triggers.forEach(t => {
    if (!grouped[t.event_object_table]) grouped[t.event_object_table] = new Set();
    grouped[t.event_object_table].add(t.trigger_name);
  });
  for (const table in grouped) {
    console.log(`Table: ${table}`);
    grouped[table].forEach(trg => console.log(`  - ${trg}`));
  }
  await client.end();
}
run();
