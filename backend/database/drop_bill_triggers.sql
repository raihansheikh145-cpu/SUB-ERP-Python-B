BEGIN;

-- Drop trigger that copies JSON to columns
DROP TRIGGER IF EXISTS trg_sync_docs_bills_doc ON public.docs_bills;

-- Drop trigger that calculates totals from JSON items
DROP TRIGGER IF EXISTS trg_00_calc_bill_totals ON public.docs_bills;

-- Drop trigger that inserts lines from JSON items
DROP TRIGGER IF EXISTS trg_01_sync_docs_bills_lines ON public.docs_bills;

COMMIT;
