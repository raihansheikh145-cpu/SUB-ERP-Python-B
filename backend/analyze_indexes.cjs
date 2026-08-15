const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function analyzeIndexes() {
  await client.connect();

  // Get all existing indexes
  const existing = await client.query(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);

  // Get all tables with row counts
  const tables = await client.query(`
    SELECT 
      relname AS table_name,
      n_live_tup AS row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
  `);

  // Get all columns (to understand what we have)
  const allCols = await client.query(`
    SELECT 
      table_name,
      column_name,
      data_type,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  // Get columns that have no index but are likely foreign keys or filters
  const fkeys = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);

  console.log('=== EXISTING INDEXES ===');
  for (const idx of existing.rows) {
    console.log(`[${idx.tablename}] ${idx.indexname}`);
    console.log(`  ${idx.indexdef}`);
  }

  console.log('\n=== TABLES BY ROW COUNT ===');
  for (const t of tables.rows) {
    console.log(`${t.table_name}: ${t.row_count} rows`);
  }

  console.log('\n=== FOREIGN KEY COLUMNS (may need indexes) ===');
  for (const fk of fkeys.rows) {
    const hasIdx = existing.rows.some(i => 
      i.tablename === fk.table_name && i.indexdef.includes(fk.column_name)
    );
    if (!hasIdx) {
      console.log(`MISSING INDEX: ${fk.table_name}.${fk.column_name}`);
    }
  }

  console.log('\n=== JSON DATA COLUMNS (may need GIN indexes) ===');
  for (const col of allCols.rows) {
    if (col.data_type === 'jsonb' || col.data_type === 'json') {
      console.log(`${col.table_name}.${col.column_name} (${col.data_type})`);
    }
  }

  await client.end();
}

analyzeIndexes().catch(console.error);
