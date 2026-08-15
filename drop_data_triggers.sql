-- Drop redundant sync triggers that rely on 'data'
DROP TRIGGER IF EXISTS trg_sync_docs_invoices_data ON docs_invoices;
DROP FUNCTION IF EXISTS sync_docs_invoices_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_invoice_lines_from_doc_data ON docs_invoices;
DROP FUNCTION IF EXISTS sync_invoice_lines_from_doc_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_docs_bills_data ON docs_bills;
DROP FUNCTION IF EXISTS sync_docs_bills_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_bill_lines_from_doc_data ON docs_bills;
DROP FUNCTION IF EXISTS sync_bill_lines_from_doc_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_docs_payments_data ON docs_payments;
DROP FUNCTION IF EXISTS sync_docs_payments_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_docs_journals_data ON docs_journals;
DROP FUNCTION IF EXISTS sync_docs_journals_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_docs_credit_notes_data ON docs_credit_notes;
DROP FUNCTION IF EXISTS sync_docs_credit_notes_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_docs_contacts_data ON docs_contacts;
DROP FUNCTION IF EXISTS sync_docs_contacts_data() CASCADE;

DROP TRIGGER IF EXISTS trg_sync_docs_products_data ON docs_products;
DROP FUNCTION IF EXISTS sync_docs_products_data() CASCADE;

-- Calculate financials shouldn't depend on data anymore
DROP TRIGGER IF EXISTS trg_calculate_docs_financials ON docs_invoices;
DROP TRIGGER IF EXISTS trg_calculate_docs_financials ON docs_bills;
DROP TRIGGER IF EXISTS trg_calculate_docs_financials ON docs_credit_notes;
DROP FUNCTION IF EXISTS calculate_docs_financials() CASCADE;

-- We also need to fix assign_document_number and audit_log_trigger!
-- For now, let's create simplified versions of them that DO NOT reference NEW.data!

CREATE OR REPLACE FUNCTION assign_document_number()
RETURNS TRIGGER AS $$
DECLARE
    v_prefix TEXT;
    v_seq TEXT;
    v_num TEXT;
    v_current_doc_num TEXT;
BEGIN
    IF TG_TABLE_NAME = 'docs_invoices' THEN v_seq := 'INVOICE'; v_current_doc_num := NEW.invoice_number;
    ELSIF TG_TABLE_NAME = 'docs_bills' THEN v_seq := 'BILL'; v_current_doc_num := NEW.bill_number;
    ELSIF TG_TABLE_NAME = 'docs_payments' THEN v_seq := 'PAYMENT'; v_current_doc_num := NEW.payment_number;
    ELSIF TG_TABLE_NAME = 'docs_journals' THEN v_seq := 'JOURNAL'; v_current_doc_num := NEW.journal_number;
    ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN v_seq := 'CREDIT_NOTE'; v_current_doc_num := NEW.credit_note_number;
    ELSIF TG_TABLE_NAME = 'docs_products' THEN v_seq := 'PRODUCT'; v_current_doc_num := NEW.sku;
    ELSIF TG_TABLE_NAME = 'docs_contacts' THEN
         IF NEW.type = 'CUSTOMER' THEN v_seq := 'CUSTOMER';
         ELSIF NEW.type = 'VENDOR' THEN v_seq := 'VENDOR';
         ELSE v_seq := 'CONTACT'; END IF;
    END IF;

    IF v_current_doc_num IS NULL OR v_current_doc_num = '' THEN
        v_prefix := get_document_prefix(NEW.company_id, v_seq);
        v_num := v_prefix || get_next_sequence(NEW.company_id, v_seq);

        IF TG_TABLE_NAME = 'docs_invoices' THEN NEW.invoice_number := v_num;
        ELSIF TG_TABLE_NAME = 'docs_bills' THEN NEW.bill_number := v_num;
        ELSIF TG_TABLE_NAME = 'docs_payments' THEN NEW.payment_number := v_num;
        ELSIF TG_TABLE_NAME = 'docs_journals' THEN NEW.journal_number := v_num; NEW.reference_number := COALESCE(NEW.reference_number, v_num);
        ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN NEW.credit_note_number := v_num;
        ELSIF TG_TABLE_NAME = 'docs_products' THEN NEW.sku := v_num;
        ELSIF TG_TABLE_NAME = 'docs_contacts' THEN NEW.code := v_num;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
BEGIN
    v_user_id := current_setting('app.current_user_id', true);
    IF v_user_id IS NULL OR v_user_id = '' THEN v_user_id := 'system'; END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO docs_audit_logs (id, entity_type, entity_id, action, changed_by, company_id, new_data)
        VALUES (gen_random_uuid()::TEXT, TG_TABLE_NAME, NEW.id, 'CREATE', v_user_id, NEW.company_id, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO docs_audit_logs (id, entity_type, entity_id, action, changed_by, company_id, old_data, new_data)
        VALUES (gen_random_uuid()::TEXT, TG_TABLE_NAME, NEW.id, 'UPDATE', v_user_id, NEW.company_id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO docs_audit_logs (id, entity_type, entity_id, action, changed_by, company_id, old_data)
        VALUES (gen_random_uuid()::TEXT, TG_TABLE_NAME, OLD.id, 'DELETE', v_user_id, OLD.company_id, to_jsonb(OLD));
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
