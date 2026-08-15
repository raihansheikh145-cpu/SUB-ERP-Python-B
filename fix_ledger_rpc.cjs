const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  
  const { rows } = await client.query(`SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_general_ledger'`);
  let src = rows[0].pg_get_functiondef;
  src = src.replace(/COALESCE\(j\.reference_number, j\.reference, j\.id\)/g, "COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)");
  await client.query(src);
  
  const { rows: rows2 } = await client.query(`SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_general_ledger_v2'`);
  let src2 = rows2[0].pg_get_functiondef;
  src2 = src2.replace(/COALESCE\(j\.reference_number, j\.reference, j\.id\)/g, "COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)");
  await client.query(src2);

  await client.end();
  console.log("Fixed get_general_ledger RPCs");
}
run();
