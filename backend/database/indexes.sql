-- =============================================================
-- ENTERPRISE-GRADE INDEX STRATEGY
-- Sub-ERP System
-- Generated: 2026-08-06
-- 
-- HOW TO APPLY:
--   psql -h <host> -U <user> -d <dbname> -f indexes.sql
--
-- SAFE TO RUN MULTIPLE TIMES:
--   All indexes use CREATE INDEX IF NOT EXISTS
--
-- INDEX TYPES USED:
--   BTREE  - Default. Best for equality, range queries, ORDER BY
--   GIN    - Best for JSONB, full-text search, array columns
--   HASH   - Best for pure equality lookups (faster than BTREE for =)
-- =============================================================

-- =============================================================
-- SECTION 1: JOURNALS (Core accounting table — most queried)
-- =============================================================

-- Fetch all journals by company + date range (Cash Ledger, GL Report, etc.)
CREATE INDEX IF NOT EXISTS idx_journals_company_date
  ON public.docs_journals (company_id, date DESC);

-- Filter by status (POSTED, DRAFT, CANCELLED)
CREATE INDEX IF NOT EXISTS idx_journals_company_status
  ON public.docs_journals (company_id, status);

-- Filter by journal type (CUSTOMER_PAYMENT, VENDOR_BILL, etc.)
CREATE INDEX IF NOT EXISTS idx_journals_company_type_date
  ON public.docs_journals (company_id, journal_type, date DESC);

-- Reference number lookups (search bar, reconciliation)
CREATE INDEX IF NOT EXISTS idx_journals_reference
  ON public.docs_journals (reference_number);

-- GIN index on JSONB data column (enables fast JSON field queries)
CREATE INDEX IF NOT EXISTS idx_journals_data_gin
  ON public.docs_journals USING GIN (data);

-- =============================================================
-- SECTION 2: JOURNAL LINES (Most JOINed table in the system)
-- =============================================================

-- Core lookup: all lines for a journal
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal_id
  ON public.docs_journal_lines (journal_id);

-- Core lookup: all lines for an account (ledger views)
CREATE INDEX IF NOT EXISTS idx_journal_lines_account_id
  ON public.docs_journal_lines (account_id);

-- Core lookup: all lines for a contact/partner
CREATE INDEX IF NOT EXISTS idx_journal_lines_contact_id
  ON public.docs_journal_lines (contact_id);

-- Composite: account + company (cash ledger SQL query)
CREATE INDEX IF NOT EXISTS idx_journal_lines_account_company
  ON public.docs_journal_lines (account_id, company_id);

-- =============================================================
-- SECTION 3: INVOICES (Sales — heavily filtered)
-- =============================================================

-- All invoices for a company, ordered by date
CREATE INDEX IF NOT EXISTS idx_invoices_company_date
  ON public.docs_invoices (company_id, date DESC);

-- Filter by status (DRAFT, POSTED, PAID, CANCELLED)
CREATE INDEX IF NOT EXISTS idx_invoices_company_status
  ON public.docs_invoices (company_id, status);

-- Customer (contact_id) lookups
CREATE INDEX IF NOT EXISTS idx_invoices_customer
  ON public.docs_invoices (customer_id);

-- Invoice number search
CREATE INDEX IF NOT EXISTS idx_invoices_number
  ON public.docs_invoices (invoice_number);

-- GIN on full JSONB data (enables fast JSON field queries like data->>'customField')
CREATE INDEX IF NOT EXISTS idx_invoices_data_gin
  ON public.docs_invoices USING GIN (data);

-- =============================================================
-- SECTION 4: INVOICE LINES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id
  ON public.docs_invoice_lines (invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_product_id
  ON public.docs_invoice_lines (product_id);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_company_id
  ON public.docs_invoice_lines (company_id);

-- =============================================================
-- SECTION 5: BILLS (Purchasing — mirrors invoice indexes)
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_bills_company_date
  ON public.docs_bills (company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_bills_company_status
  ON public.docs_bills (company_id, status);

CREATE INDEX IF NOT EXISTS idx_bills_vendor_id
  ON public.docs_bills (vendor_id);

CREATE INDEX IF NOT EXISTS idx_bills_bill_number
  ON public.docs_bills (bill_number);

CREATE INDEX IF NOT EXISTS idx_bills_data_gin
  ON public.docs_bills USING GIN (data);

-- =============================================================
-- SECTION 6: BILL LINES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_bill_lines_bill_id
  ON public.docs_bill_lines (bill_id);

CREATE INDEX IF NOT EXISTS idx_bill_lines_product_id
  ON public.docs_bill_lines (product_id);

-- =============================================================
-- SECTION 7: PAYMENTS
-- =============================================================

-- All payments for a company by date
CREATE INDEX IF NOT EXISTS idx_payments_company_date
  ON public.docs_payments (company_id, date DESC);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_payments_company_status
  ON public.docs_payments (company_id, status);

-- Filter by contact (customer/vendor)
CREATE INDEX IF NOT EXISTS idx_payments_contact_id
  ON public.docs_payments (contact_id);

-- Payment number search
CREATE INDEX IF NOT EXISTS idx_payments_payment_number
  ON public.docs_payments (payment_number);

-- Type filter (RECEIPT, PAYMENT)
CREATE INDEX IF NOT EXISTS idx_payments_company_type
  ON public.docs_payments (company_id, type);

-- GIN on applied_invoices JSONB (fast lookup: which payment covers which invoice)
CREATE INDEX IF NOT EXISTS idx_payments_applied_invoices_gin
  ON public.docs_payments USING GIN (applied_invoices);

CREATE INDEX IF NOT EXISTS idx_payments_applied_bills_gin
  ON public.docs_payments USING GIN (applied_bills);

CREATE INDEX IF NOT EXISTS idx_payments_data_gin
  ON public.docs_payments USING GIN (data);

-- =============================================================
-- SECTION 8: ACCOUNTS (Chart of Accounts)
-- =============================================================

-- Company accounts lookup
CREATE INDEX IF NOT EXISTS idx_accounts_company_id
  ON public.docs_accounts (company_id);

-- Account code lookup (used everywhere for matching 100100, 500101 etc.)
CREATE INDEX IF NOT EXISTS idx_accounts_code
  ON public.docs_accounts (code);

-- Composite: company + code (most common pattern in SQL functions)
CREATE INDEX IF NOT EXISTS idx_accounts_company_code
  ON public.docs_accounts (company_id, code);

-- Account type filter (ASSET, LIABILITY, REVENUE, etc.)
CREATE INDEX IF NOT EXISTS idx_accounts_company_type
  ON public.docs_accounts (company_id, type);

-- GIN on data JSONB for any JSON field queries
CREATE INDEX IF NOT EXISTS idx_accounts_data_gin
  ON public.docs_accounts USING GIN (data);

-- =============================================================
-- SECTION 9: CONTACTS (Customers & Vendors)
-- =============================================================

-- Company contacts lookup
CREATE INDEX IF NOT EXISTS idx_contacts_company_id
  ON public.docs_contacts (company_id);

-- Contact type filter (CUSTOMER, VENDOR, BOTH)
CREATE INDEX IF NOT EXISTS idx_contacts_company_type
  ON public.docs_contacts (company_id, type);

-- Name search (partial match — use pg_trgm for LIKE queries)
CREATE INDEX IF NOT EXISTS idx_contacts_name
  ON public.docs_contacts (name);

-- =============================================================
-- SECTION 10: PRODUCTS
-- =============================================================

-- Category + company filter
CREATE INDEX IF NOT EXISTS idx_products_company_category
  ON public.docs_products (company_id, category_id);

-- Product name search
CREATE INDEX IF NOT EXISTS idx_products_name
  ON public.docs_products (name);

-- GIN on data JSONB
CREATE INDEX IF NOT EXISTS idx_products_data_gin
  ON public.docs_products USING GIN (data);

-- =============================================================
-- SECTION 11: PRODUCT COSTS (WAC — Weighted Average Cost)
-- =============================================================

-- Core WAC lookup (used every time an invoice is posted)
CREATE INDEX IF NOT EXISTS idx_product_costs_lookup
  ON public.docs_product_costs (company_id, product_id, warehouse_id);

-- =============================================================
-- SECTION 12: CREDIT NOTES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_credit_notes_company_date
  ON public.docs_credit_notes (company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_credit_notes_company_status
  ON public.docs_credit_notes (company_id, status);

CREATE INDEX IF NOT EXISTS idx_credit_notes_customer
  ON public.docs_credit_notes (customer_id);

-- =============================================================
-- SECTION 13: AUDIT LOG (Compliance — large table)
-- =============================================================

-- Filter by company + time range
CREATE INDEX IF NOT EXISTS idx_audit_log_company_created
  ON public.docs_audit_log (company_id, created_at DESC);

-- Filter by table name (which entity was changed)
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name
  ON public.docs_audit_log (table_name, created_at DESC);

-- Filter by user (who made the change)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
  ON public.docs_audit_log (user_id, created_at DESC);

-- Filter by record id (history of a specific record)
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id
  ON public.docs_audit_log (record_id);

-- =============================================================
-- SECTION 14: AUTH USERS
-- =============================================================

-- Email lookup (used on every login)
CREATE INDEX IF NOT EXISTS idx_auth_users_email
  ON public.auth_users (email);

-- Role filter (ADMIN, ACCOUNTANT, etc.)
CREATE INDEX IF NOT EXISTS idx_auth_users_role
  ON public.auth_users (role);

-- Active users filter
CREATE INDEX IF NOT EXISTS idx_auth_users_active
  ON public.auth_users (is_active, role);

-- =============================================================
-- SECTION 15: INVENTORY
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_inventory_txns_company_product
  ON public.docs_inventory_transactions (company_id, product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_txns_company_date
  ON public.docs_inventory_transactions (company_id, created_at DESC);

-- =============================================================
-- SECTION 16: LOANS & PAYROLL
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_loans_company_status
  ON public.docs_loans (company_id, status);

CREATE INDEX IF NOT EXISTS idx_loans_contact_id
  ON public.docs_loans (company_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_loans_date
  ON public.docs_loans (company_id, date DESC);

-- docs_payslips, docs_leaves, docs_tasks store all fields in JSONB data
-- Use GIN index so any field inside data is queryable quickly
CREATE INDEX IF NOT EXISTS idx_payslips_data_gin
  ON public.docs_payslips USING GIN (data);

CREATE INDEX IF NOT EXISTS idx_payslips_company
  ON public.docs_payslips (company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaves_data_gin
  ON public.docs_leaves USING GIN (data);

CREATE INDEX IF NOT EXISTS idx_leaves_company
  ON public.docs_leaves (company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_data_gin
  ON public.docs_tasks USING GIN (data);

CREATE INDEX IF NOT EXISTS idx_tasks_company
  ON public.docs_tasks (company_id, updated_at DESC);

-- =============================================================
-- SECTION 18: SEQUENCE COUNTERS (Prevent slow invoice numbering)
-- =============================================================

-- Already has PK on (company_code, seq_group) — no extra needed.
-- But add a covering index for the update pattern:
CREATE INDEX IF NOT EXISTS idx_seq_counters_lookup
  ON public.sequence_counters (company_code, seq_group, prefix);

-- =============================================================
-- SECTION 19: FULL-TEXT SEARCH (pg_trgm — for LIKE queries)
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fast LIKE/ILIKE search on contact names (search bar)
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON public.docs_contacts USING GIN (name gin_trgm_ops);

-- Fast LIKE/ILIKE search on product names
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON public.docs_products USING GIN (name gin_trgm_ops);

-- Fast invoice number search
CREATE INDEX IF NOT EXISTS idx_invoices_number_trgm
  ON public.docs_invoices USING GIN (invoice_number gin_trgm_ops);

-- Fast bill number search
CREATE INDEX IF NOT EXISTS idx_bills_number_trgm
  ON public.docs_bills USING GIN (bill_number gin_trgm_ops);

-- Fast payment number search
CREATE INDEX IF NOT EXISTS idx_payments_number_trgm
  ON public.docs_payments USING GIN (payment_number gin_trgm_ops);

-- Fast reference number search across journals
CREATE INDEX IF NOT EXISTS idx_journals_reference_trgm
  ON public.docs_journals USING GIN (reference_number gin_trgm_ops);

-- =============================================================
-- DONE
-- Summary of index strategy:
--   BTREE  - All date ranges, status filters, company_id joins
--   GIN    - All JSONB data columns, LIKE search via pg_trgm
--   UNIQUE - Already on PKs, email, invoice/bill numbers
--   COMPOSITE - (company_id, date), (company_id, status), etc.
-- =============================================================
