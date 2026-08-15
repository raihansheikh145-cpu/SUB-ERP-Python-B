const { Client } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function dump() {
  await client.connect();

  let output = '';
  output += `-- =============================================================\n`;
  output += `-- DATABASE SCHEMA DUMP\n`;
  output += `-- Generated: ${new Date().toISOString()}\n`;
  output += `-- Run this file on a fresh PostgreSQL database to get started.\n`;
  output += `-- =============================================================\n\n`;

  // 1. Get all custom tables in public schema
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  output += `-- =============================================================\n`;
  output += `-- SECTION 1: TABLE DEFINITIONS\n`;
  output += `-- =============================================================\n\n`;

  for (const row of tables.rows) {
    const tableName = row.table_name;
    const cols = await client.query(`
      SELECT 
        c.column_name,
        c.data_type,
        c.udt_name,
        c.character_maximum_length,
        c.column_default,
        c.is_nullable,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = $1
      ORDER BY c.ordinal_position
    `, [tableName]);

    output += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
    const colDefs = [];
    for (const col of cols.rows) {
      let typeDef = col.data_type;
      if (col.data_type === 'USER-DEFINED') typeDef = col.udt_name;
      if (col.data_type === 'character varying' && col.character_maximum_length) typeDef = `varchar(${col.character_maximum_length})`;
      if (col.data_type === 'numeric' && col.numeric_precision) typeDef = `numeric(${col.numeric_precision},${col.numeric_scale || 0})`;
      if (col.data_type === 'ARRAY') typeDef = col.udt_name.replace('_', '') + '[]';

      let def = `  ${col.column_name} ${typeDef}`;
      if (col.column_default) def += ` DEFAULT ${col.column_default}`;
      if (col.is_nullable === 'NO') def += ` NOT NULL`;
      colDefs.push(def);
    }

    // Get primary key
    const pk = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = $1
    `, [tableName]);
    if (pk.rows.length > 0) {
      const pkCols = pk.rows.map(r => r.column_name).join(', ');
      colDefs.push(`  PRIMARY KEY (${pkCols})`);
    }

    output += colDefs.join(',\n') + '\n);\n\n';
  }

  // 2. Get all custom functions
  const fns = await client.query(`
    SELECT proname, pg_get_functiondef(oid) as funcdef
    FROM pg_proc
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND prokind = 'f'
    ORDER BY proname
  `);

  output += `-- =============================================================\n`;
  output += `-- SECTION 2: FUNCTIONS\n`;
  output += `-- =============================================================\n\n`;

  for (const fn of fns.rows) {
    output += `-- Function: ${fn.proname}\n`;
    output += `CREATE OR REPLACE ${fn.funcdef.split('CREATE OR REPLACE').pop().trim().replace(/^FUNCTION /, 'FUNCTION ')}`;
    if (!output.trimEnd().endsWith(';')) output = output.trimEnd() + ';\n';
    output += '\n\n';
  }

  // 3. Get indexes
  output += `-- =============================================================\n`;
  output += `-- SECTION 3: INDEXES\n`;
  output += `-- =============================================================\n\n`;

  const indexes = await client.query(`
    SELECT indexname, indexdef FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname
  `);
  for (const idx of indexes.rows) {
    output += `${idx.indexdef};\n`;
  }
  output += '\n';

  // 4. Foreign key constraints
  output += `-- =============================================================\n`;
  output += `-- SECTION 4: FOREIGN KEYS\n`;
  output += `-- =============================================================\n\n`;

  const fkeys = await client.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  for (const fk of fkeys.rows) {
    output += `ALTER TABLE public.${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table_name}(${fk.foreign_column_name}) ON DELETE ${fk.delete_rule};\n`;
  }

  await client.end();
  const path = require('path');
  const outDir = path.join(__dirname, 'database');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'schema.sql'), output, 'utf8');
  console.log('Done! schema.sql written with', tables.rows.length, 'tables and', fns.rows.length, 'functions.');
}

dump().catch(console.error);
