const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgresql://postgres.hkdgsnlrhvmtjddwvuzd:hMzz9N3jdfMS2buB@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

// Tables that contain configuration/seed data we want to include
// We exclude large transactional tables (invoices, payments, journals, audit_log, etc.)
// but include master/reference data
const SEED_TABLES = [
  'docs_companies',
  'docs_accounts',
  'docs_contacts',
  'docs_products',
  'docs_brands',
  'docs_categories',
  'docs_warehouses',
  'docs_roles',
  'docs_users',
  'auth_users',
  'sequence_counters',
  'company_doc_sequences',
  'docs_document_sequences',
];

function escapeVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'object') {
    // JSONB, arrays
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  // Strings
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function dumpData() {
  await client.connect();

  let output = `-- =============================================================\n`;
  output += `-- DATA DUMP (Seed / Master Data)\n`;
  output += `-- Generated: ${new Date().toISOString()}\n`;
  output += `-- This file contains the actual data rows for:\n`;
  output += `--   - Companies, Accounts, Contacts, Products\n`;
  output += `--   - Warehouses, Users, Roles, Sequences\n`;
  output += `-- Run AFTER schema.sql\n`;
  output += `-- =============================================================\n\n`;

  for (const table of SEED_TABLES) {
    // Check if table exists
    const exists = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [table]
    );
    if (exists.rows.length === 0) {
      console.log(`SKIP (not found): ${table}`);
      continue;
    }

    const rows = await client.query(`SELECT * FROM public.${table} ORDER BY 1`);
    if (rows.rows.length === 0) {
      console.log(`SKIP (empty): ${table}`);
      continue;
    }

    const cols = rows.fields.map(f => f.name);

    output += `-- ---------------------------------------------------------\n`;
    output += `-- Table: ${table} (${rows.rows.length} rows)\n`;
    output += `-- ---------------------------------------------------------\n`;
    output += `TRUNCATE TABLE public.${table} CASCADE;\n`;

    for (const row of rows.rows) {
      const values = cols.map(c => escapeVal(row[c])).join(', ');
      output += `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${values});\n`;
    }

    output += `\n`;
    console.log(`✅ ${table}: ${rows.rows.length} rows`);
  }

  // Also dump all tables with actual transactional data (invoices, journals, etc.)
  const TRANSACTIONAL_TABLES = [
    'docs_invoices',
    'docs_invoice_lines',
    'docs_bills',
    'docs_bill_lines',
    'docs_payments',
    'docs_journals',
    'docs_journal_lines',
    'docs_inventory_transactions',
    'docs_product_costs',
    'docs_product_stocks',
    'docs_credit_notes',
    'docs_credit_note_lines',
    'docs_stock_movements',
    'docs_loans',
    'docs_payslips',
    'docs_leaves',
    'docs_tasks',
    'docs_system_logs',
    'docs_attendance',
  ];

  output += `\n-- =============================================================\n`;
  output += `-- TRANSACTIONAL DATA (actual business records)\n`;
  output += `-- =============================================================\n\n`;

  for (const table of TRANSACTIONAL_TABLES) {
    const exists = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [table]
    );
    if (exists.rows.length === 0) {
      console.log(`SKIP (not found): ${table}`);
      continue;
    }

    const rows = await client.query(`SELECT * FROM public.${table} ORDER BY 1`);
    if (rows.rows.length === 0) {
      console.log(`SKIP (empty): ${table}`);
      continue;
    }

    const cols = rows.fields.map(f => f.name);

    output += `-- ---------------------------------------------------------\n`;
    output += `-- Table: ${table} (${rows.rows.length} rows)\n`;
    output += `-- ---------------------------------------------------------\n`;
    output += `TRUNCATE TABLE public.${table} CASCADE;\n`;

    for (const row of rows.rows) {
      const values = cols.map(c => escapeVal(row[c])).join(', ');
      output += `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${values});\n`;
    }

    output += `\n`;
    console.log(`✅ ${table}: ${rows.rows.length} rows`);
  }

  await client.end();

  const outPath = path.join(__dirname, 'database', 'data.sql');
  fs.writeFileSync(outPath, output, 'utf8');
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`\nDone! data.sql written (${sizeKb} KB)`);
}

dumpData().catch(console.error);
