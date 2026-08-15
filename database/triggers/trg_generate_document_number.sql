CREATE OR REPLACE FUNCTION public.generate_document_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
    comp_code TEXT;
    doc_prefix TEXT;
    new_seq BIGINT;
    final_number TEXT;
    existing_num TEXT;
BEGIN
    -- Only generate if status is POSTED/PAID/SENT/ACTIVE (non-draft)
    -- and numbering is not already set (or is still 'DRAFT-...')
    
    -- Determine prefix based on table
    IF TG_TABLE_NAME = 'docs_invoices' THEN doc_prefix := 'INV'; 
    ELSIF TG_TABLE_NAME = 'docs_bills' THEN doc_prefix := 'BIL';
    ELSIF TG_TABLE_NAME = 'docs_credit_notes' THEN doc_prefix := 'CN';
    ELSIF TG_TABLE_NAME = 'docs_payments' THEN doc_prefix := 'PAY';
    ELSIF TG_TABLE_NAME = 'docs_journals' THEN doc_prefix := 'JEN';
    ELSIF TG_TABLE_NAME = 'docs_loans' THEN doc_prefix := 'LO';
    ELSE RETURN NEW;
    END IF;

    -- Get current number from NEW.data
    existing_num := NULL;
    IF TG_TABLE_NAME = 'docs_invoices' THEN existing_num := NEW.invoice_number;
    ELSIF TG_TABLE_NAME = 'docs_bills' THEN existing_num := NEW.bill_number;
    ELSIF TG_TABLE_NAME = 'docs_payments' THEN existing_num := NEW.payment_number;
    ELSIF TG_TABLE_NAME = 'docs_journals' THEN existing_num := NEW.reference_number;
    ELSIF TG_TABLE_NAME = 'docs_loans' THEN existing_num := (NEW.data->>'number');
    END IF;

    IF existing_num IS NULL THEN
        existing_num := (NEW.data->>'number');
    END IF;

    -- If status is changing to something non-DRAFT and we don't have a real number yet
    IF (NEW.status NOT IN ('DRAFT', 'DELETED', 'VOID')) AND (existing_num IS NULL OR existing_num = '' OR existing_num LIKE 'DRAFT-%' OR existing_num = 'NEW') THEN
        
        -- Get company code
        SELECT code INTO comp_code FROM docs_companies WHERE id = NEW.company_id;
        IF comp_code IS NULL THEN comp_code := 'UNK'; END IF;

        -- Increment sequence atomicaly
        INSERT INTO docs_document_sequences (company_id, document_type, last_sequence)
        VALUES (NEW.company_id, doc_prefix, 1)
        ON CONFLICT (company_id, document_type) 
        DO UPDATE SET last_sequence = docs_document_sequences.last_sequence + 1
        RETURNING last_sequence INTO new_seq;

        -- Format: PREFIX-CODE-000000 (6 digits padding)
        final_number := doc_prefix || '-' || comp_code || '-' || LPAD(new_seq::text, 6, '0');

        -- Update the specific column and the JSONB data
        NEW.data := jsonb_set(NEW.data, '{number}', to_jsonb(final_number));
        
        -- Automatically update the document date to CURRENT_DATE when generating the number
        NEW.date := CURRENT_DATE;
        NEW.data := jsonb_set(NEW.data, '{date}', to_jsonb(CURRENT_DATE::text));
        
        -- Special fields based on document type
        IF TG_TABLE_NAME = 'docs_invoices' THEN 
            NEW.invoice_number := final_number;
            -- Update invoiceDate in json if exists
            IF NEW.data ? 'invoiceDate' THEN
                NEW.data := jsonb_set(NEW.data, '{invoiceDate}', to_jsonb(CURRENT_DATE::text));
            END IF;
        ELSIF TG_TABLE_NAME = 'docs_bills' THEN 
            NEW.bill_number := final_number;
        ELSIF TG_TABLE_NAME = 'docs_payments' THEN 
            NEW.payment_number := final_number;
        ELSIF TG_TABLE_NAME = 'docs_journals' THEN 
            NEW.reference_number := final_number;
        END IF;

    END IF;

    RETURN NEW;
END;
$function$;
