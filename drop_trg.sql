DROP TRIGGER IF EXISTS trg_post_inventory_ledger_lines ON docs_inventory_transactions;
DROP TRIGGER IF EXISTS trg_post_invoice_journal ON docs_invoices;
DROP TRIGGER IF EXISTS trg_post_bill_journal ON docs_bills;
DROP TRIGGER IF EXISTS trg_post_payment_journal ON docs_payments;
DROP TRIGGER IF EXISTS trg_post_credit_note_journal ON docs_credit_notes;
