-- =============================================================
-- data JSONB CLEANUP MIGRATION
-- Generated: 2026-08-06
-- 
-- Purpose: Remove duplicate scalar fields from data jsonb columns.
--          Keep ONLY array/object fields that have no column equivalent.
--
-- SAFE TO RUN: Uses subtraction operator (data - ARRAY[...])
--              Individual columns are NOT touched.
-- =============================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. docs_invoices
--    KEEP: items, messages
--    REMOVE: all other 65 scalar duplicate fields
-- ---------------------------------------------------------
UPDATE public.docs_invoices
SET data = data - ARRAY[
  'id', 'status', 'total', 'subtotal', 'date', 'customerId', 'customer_id',
  'companyId', 'company_code', 'companyCode', 'invoiceNumber', 'invoice_number',
  'invoiceDate', 'invoice_date', 'dueDate', 'due_date', 'reference', 'salesperson',
  'srId', 'sr_id', 'createdById', 'created_by_id', 'createdAt', 'updatedAt',
  'updated_at', 'version', 'taxTotal', 'tax_total', 'discountTotal', 'discount_total',
  'totalDiscount', 'totalTax', 'totalProfit', 'total_profit', 'journalEntryId',
  'journal_entry_id', 'journalId', 'journalType', 'note', 'number', 'accountId',
  'contactId', 'vendorId', 'customerNote', 'customer_note', 'deliveryPerson',
  'delivery_person', 'preparedBy', 'externalId', 'amortizationSchedule',
  'billDate', 'billNumber', 'companyIds', 'costPrice', 'interestRate', 'interestType',
  'invitationToken', 'paidPeriods', 'price', 'principalAmount', 'roleId',
  'startDate', 'termMonths', 'userUuid', 'data'
]
WHERE data IS NOT NULL;

-- ---------------------------------------------------------
-- 2. docs_bills
--    KEEP: items
--    REMOVE: all other 57 scalar duplicate fields
-- ---------------------------------------------------------
UPDATE public.docs_bills
SET data = data - ARRAY[
  'id', 'status', 'total', 'subtotal', 'date', 'vendorId', 'vendor_id',
  'companyId', 'company_code', 'companyCode', 'billNumber', 'bill_number',
  'billDate', 'bill_date', 'dueDate', 'due_date', 'reference', 'salesperson',
  'createdById', 'created_by_id', 'createdAt', 'updatedAt', 'updated_at',
  'version', 'taxTotal', 'tax_total', 'discountTotal', 'discount_total',
  'totalProfit', 'journalEntryId', 'journal_entry_id', 'journalId', 'journalType',
  'note', 'number', 'accountId', 'contactId', 'customerId', 'customerNote',
  'deliveryPerson', 'preparedBy', 'externalId', 'amortizationSchedule',
  'companyIds', 'costPrice', 'interestRate', 'interestType', 'invitationToken',
  'invoiceDate', 'invoiceNumber', 'paidPeriods', 'price', 'principalAmount',
  'roleId', 'startDate', 'termMonths', 'userUuid', 'data'
]
WHERE data IS NOT NULL;

-- ---------------------------------------------------------
-- 3. docs_payments
--    KEEP: appliedInvoices, appliedBills
--    REMOVE: journalEntryId, number, status (and any others)
-- ---------------------------------------------------------
UPDATE public.docs_payments
SET data = data - ARRAY[
  'id', 'status', 'number', 'journalEntryId', 'journal_entry_id',
  'companyId', 'contactId', 'date', 'amount', 'type', 'method',
  'reference', 'paymentNumber', 'payment_number', 'accountId',
  'createdAt', 'updatedAt', 'updated_at', 'version', 'paymentCategory',
  'memo', 'note', 'salesperson', 'preparedBy'
]
WHERE data IS NOT NULL;

-- ---------------------------------------------------------
-- 4. docs_journals
--    KEEP: lines (journal line details if stored here)
--    REMOVE: all scalar duplicates
-- ---------------------------------------------------------
UPDATE public.docs_journals
SET data = data - ARRAY[
  'id', 'status', 'companyId', 'date', 'journal_number', 'journalEntryId',
  'journalType', 'reference', 'source'
]
WHERE data IS NOT NULL;

COMMIT;

-- Verify results
SELECT 
  'docs_invoices' AS tbl,
  COUNT(*) AS total_rows,
  AVG(jsonb_array_length(COALESCE(data->'items', '[]'::jsonb))) AS avg_items_count,
  COUNT(data->'messages') AS has_messages
FROM public.docs_invoices
UNION ALL
SELECT 
  'docs_bills',
  COUNT(*),
  AVG(jsonb_array_length(COALESCE(data->'items', '[]'::jsonb))),
  0
FROM public.docs_bills
UNION ALL
SELECT 
  'docs_payments',
  COUNT(*),
  AVG(jsonb_array_length(COALESCE(data->'appliedInvoices', '[]'::jsonb))),
  0
FROM public.docs_payments
UNION ALL
SELECT 
  'docs_journals',
  COUNT(*),
  0,
  0
FROM public.docs_journals;
