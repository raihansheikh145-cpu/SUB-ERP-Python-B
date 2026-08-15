CREATE OR REPLACE FUNCTION post_bill(p_bill_id text, p_company_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_bill RECORD;
    v_journal_id TEXT;
    v_vendor_account TEXT;
    v_expense_account TEXT;
    v_bill_number TEXT;
BEGIN
    SELECT * INTO v_bill FROM docs_bills WHERE id = p_bill_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found: %', p_bill_id; END IF;

    v_bill_number := v_bill.bill_number;
    IF v_bill_number IS NULL OR v_bill_number = '' OR v_bill_number LIKE 'DRAFT-%' THEN
       v_bill_number := get_next_company_doc_number(p_company_id, 'BILL');
    END IF;

    SELECT id INTO v_journal_id FROM docs_journals 
    WHERE (journal_number = v_bill_number OR reference_number = v_bill_number) AND company_id = p_company_id LIMIT 1;
    
    IF v_journal_id IS NULL THEN
        v_journal_id := 'JE-' || UPPER(p_bill_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM docs_journals WHERE id = v_journal_id) THEN
        INSERT INTO docs_journals (
            id, company_id, date, journal_date, reference_number, journal_number, journal_type, status, description, updated_at
        )
        VALUES (
            v_journal_id, p_company_id, v_bill.date, v_bill.date, v_bill_number, v_bill_number, 'BILL', 'POSTED', 'Bill: ' || v_bill_number, NOW()
        );
    ELSE
        UPDATE docs_journals SET status = 'POSTED', updated_at = NOW(), reference_number = v_bill_number, journal_number = v_bill_number WHERE id = v_journal_id;
    END IF;

    -- FIND VENDOR ACCOUNT (ACCOUNTS PAYABLE)
    SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE code IN ('200100', '200101', '2001') AND company_id::text = p_company_id LIMIT 1;
    IF v_vendor_account IS NULL THEN 
         SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE name ILIKE '%Accounts Payable%' AND company_id::text = p_company_id LIMIT 1;
    END IF;
    IF v_vendor_account IS NULL THEN 
         SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE name ILIKE '%Payable%' AND type = 'LIABILITY' AND company_id::text = p_company_id LIMIT 1;
    END IF;
    IF v_vendor_account IS NULL THEN
         SELECT id::text INTO v_vendor_account FROM docs_accounts WHERE company_id::text = p_company_id ORDER BY id LIMIT 1;
    END IF;

    -- FIND EXPENSE/INVENTORY ACCOUNT
    SELECT id::text INTO v_expense_account FROM docs_accounts WHERE code IN ('500100', '500101', '100501', '100500') AND company_id::text = p_company_id LIMIT 1;
    IF v_expense_account IS NULL THEN
         SELECT id::text INTO v_expense_account FROM docs_accounts WHERE name ILIKE '%Inventory%' AND company_id::text = p_company_id LIMIT 1;
    END IF;
    IF v_expense_account IS NULL THEN
         SELECT id::text INTO v_expense_account FROM docs_accounts WHERE name ILIKE '%Cost of Goods%' AND company_id::text = p_company_id LIMIT 1;
    END IF;
    IF v_expense_account IS NULL THEN
         SELECT id::text INTO v_expense_account FROM docs_accounts WHERE company_id::text = p_company_id ORDER BY id LIMIT 1;
    END IF;

    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;

    IF v_vendor_account IS NOT NULL AND v_expense_account IS NOT NULL THEN
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description, updated_at)
        VALUES 
        (gen_random_uuid()::text, v_journal_id, p_company_id, v_expense_account, COALESCE(v_bill.total, 0), 0, 'Expense/Inventory for ' || v_bill_number, NOW()),
        (gen_random_uuid()::text, v_journal_id, p_company_id, v_vendor_account, 0, COALESCE(v_bill.total, 0), 'Payable for ' || v_bill_number, NOW());
    END IF;

    -- FINALLY, UPDATE docs_bills NOW THAT JOURNALS AND LINES EXIST
    UPDATE docs_bills 
    SET status = 'POSTED', 
        bill_number = v_bill_number,
        journal_entry_id = v_journal_id,
        data = jsonb_set(
                 jsonb_set(
                   jsonb_set(data, '{status}', '"POSTED"'),
                   '{journalEntryId}', to_jsonb(v_journal_id)
                 ),
                 '{number}', to_jsonb(v_bill_number)
               )
    WHERE id = p_bill_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'bill_number', v_bill_number);
END;
$function$;
