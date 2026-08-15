CREATE OR REPLACE FUNCTION post_bill(p_bill_id text, p_company_id text) RETURNS jsonb AS $$
DECLARE
    v_bill RECORD;
    v_journal_id TEXT;
    v_vendor_account TEXT;
    v_expense_account TEXT;
    v_bill_number TEXT;
    v_item JSONB;
    v_wh_id TEXT;
    v_unit_price NUMERIC;
    v_qty NUMERIC;
    v_final_status TEXT;
BEGIN
    SELECT * INTO v_bill FROM docs_bills WHERE id = p_bill_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found: %', p_bill_id; END IF;

    v_final_status := v_bill.status;
    IF v_final_status NOT IN ('POSTED', 'PAID', 'PARTIAL') THEN
        v_final_status := 'POSTED';
    END IF;

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
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description, updated_at)
        VALUES 
        (gen_random_uuid()::text, v_journal_id, p_company_id, v_expense_account, v_bill.vendor_id, COALESCE(v_bill.total, 0), 0, 'Expense/Inventory for ' || v_bill_number, NOW()),
        (gen_random_uuid()::text, v_journal_id, p_company_id, v_vendor_account, v_bill.vendor_id, 0, COALESCE(v_bill.total, 0), 'Payable for ' || v_bill_number, NOW());
    END IF;

    -- Delete existing inventory transactions for this bill
    DELETE FROM docs_inventory_transactions WHERE reference_id = p_bill_id;
    
    -- Insert inventory transactions for products
    v_wh_id := 'wh-' || p_company_id;
    IF v_bill.data->'items' IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_bill.data->'items') LOOP
            IF v_item->>'productId' IS NOT NULL AND (v_item->>'type' = 'PRODUCT' OR v_item->>'type' IS NULL) THEN
                v_qty := (v_item->>'quantity')::NUMERIC;
                v_unit_price := (v_item->>'unitPrice')::NUMERIC;
                
                IF v_qty > 0 THEN
                    INSERT INTO docs_inventory_transactions (
                        id, company_id, product_id, warehouse_id, transaction_type, 
                        quantity, reference_id, reference_type, date, cost_price, unit_price,
                        updated_at
                    ) VALUES (
                        gen_random_uuid()::text, p_company_id, v_item->>'productId', v_wh_id, 'IN',
                        v_qty, p_bill_id, 'BILL', v_bill.date, v_unit_price, v_unit_price,
                        NOW()
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- FINALLY, UPDATE docs_bills NOW THAT JOURNALS AND LINES EXIST
    UPDATE docs_bills 
    SET status = v_final_status, 
        bill_number = v_bill_number,
        journal_entry_id = v_journal_id,
        data = jsonb_set(
                 jsonb_set(
                   jsonb_set(data, '{status}', to_jsonb(v_final_status)),
                   '{journalEntryId}', to_jsonb(v_journal_id)
                 ),
                 '{number}', to_jsonb(v_bill_number)
               )
    WHERE id = p_bill_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'bill_number', v_bill_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
