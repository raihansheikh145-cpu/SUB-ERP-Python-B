const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function applyIndexes() {
  await client.connect();

  const sql = fs.readFileSync(path.join(__dirname, 'database', 'indexes.sql'), 'utf8');
  
  // Split on semicolons to execute statement by statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let success = 0;
  let failed = 0;
  const errors = [];

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      // Extract index name for logging
      const match = stmt.match(/INDEX(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
      const name = match ? match[1] : stmt.substring(0, 60) + '...';
      console.log(`✅ ${name}`);
      success++;
    } catch (e) {
      const match = stmt.match(/INDEX(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
      const name = match ? match[1] : stmt.substring(0, 60);
      console.log(`❌ ${name}: ${e.message}`);
      errors.push({ name, error: e.message });
      failed++;
    }
  }

  console.log(`\n============================`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed:  ${failed}`);
  if (errors.length > 0) {
    console.log('\nFailed items:');
    errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
  }

  await client.end();
}

applyIndexes().catch(console.error);
