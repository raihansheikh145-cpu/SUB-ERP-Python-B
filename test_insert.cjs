const { Client } = require('pg');
async function run() {
  const client = new Client({ 
    connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    await client.query(`
      INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, reference, updated_at)
      VALUES ('TEST-JE-123', 'd9dbb775-6839-4201-9dda-caa39e271201', '2026-08-09', '2026-08-09', 'INV', 'DRAFT', 'INV-TEST-01', 'INV-TEST-01', NOW())
    `);
    console.log("Success");
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
