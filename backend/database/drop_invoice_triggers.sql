BEGIN;

-- Drop trigger that copies JSON to columns
DROP TRIGGER IF EXISTS trg_sync_docs_invoices_doc ON public.docs_invoices;

-- Drop trigger that calculates totals from JSON items
DROP TRIGGER IF EXISTS trg_00_calc_invoice_totals ON public.docs_invoices;

-- Drop trigger that inserts lines from JSON items
DROP TRIGGER IF EXISTS trg_01_sync_invoice_lines ON public.docs_invoices;

COMMIT;
