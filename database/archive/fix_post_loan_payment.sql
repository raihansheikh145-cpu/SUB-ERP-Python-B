CREATE OR REPLACE FUNCTION public.post_loan_payment_rpc(
    p_loan_id text, 
    p_period integer, 
    p_date text, 
    p_interest_to_pay numeric, 
    p_principal_to_pay numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
    v_loan RECORD;
    v_cash_acc TEXT;
    v_loan_acc TEXT;
    v_interest_acc TEXT;
    v_journal_id TEXT;
    v_desc TEXT;
    v_is_received BOOLEAN;
    v_company_id TEXT;
    v_contact_id TEXT;
    
    v_schedule JSONB;
    v_item JSONB;
    v_new_schedule JSONB := '[]'::jsonb;
    v_paid_periods TEXT[];
    
    v_rem_principal NUMERIC;
    v_total_paid NUMERIC;
BEGIN
    SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;

    v_company_id := v_loan.company_id;
    
    v_contact_id := (v_loan.data->>'contactId');
    IF v_contact_id IS NULL THEN v_contact_id := v_loan.contact_id; END IF;
    
    v_is_received := (v_loan.data->>'type') = 'RECEIVED';
    v_schedule := v_loan.data->'amortizationSchedule';
    IF v_schedule IS NULL THEN
        v_schedule := v_loan.data->'amortization_schedule';
    END IF;
    
    v_paid_periods := COALESCE(v_loan.paid_periods, ARRAY[]::TEXT[]);
    
    v_rem_principal := p_principal_to_pay;
    v_total_paid := p_principal_to_pay + p_interest_to_pay;
    
    v_journal_id := 'JE-LPAY-' || p_loan_id || '-' || p_period::TEXT || '-' || substr(md5(random()::text), 1, 4);
    
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
        IF (v_item->>'status') = 'PAID' OR (v_item->>'period')::TEXT = ANY(v_paid_periods) THEN
            v_new_schedule := v_new_schedule || v_item;
            CONTINUE;
        END IF;

        IF v_rem_principal >= ((v_item->>'principal')::NUMERIC - 0.01) THEN
            v_rem_principal := v_rem_principal - (v_item->>'principal')::NUMERIC;
            
            v_item := jsonb_set(v_item, '{status}', '"PAID"');
            v_item := jsonb_set(v_item, '{principalPaid}', 'true');
            v_item := jsonb_set(v_item, '{interestPaid}', 'true');
            v_item := jsonb_set(v_item, '{journalEntryId}', to_jsonb(v_journal_id));
            
            IF NOT ((v_item->>'period')::TEXT = ANY(v_paid_periods)) THEN
                v_paid_periods := array_append(v_paid_periods, (v_item->>'period')::TEXT);
            END IF;
            
        ELSIF v_rem_principal > 0 AND (v_item->>'period')::INT = p_period THEN
            v_rem_principal := 0; 
            v_item := jsonb_set(v_item, '{status}', '"PAID"');
            v_item := jsonb_set(v_item, '{principalPaid}', 'true');
            v_item := jsonb_set(v_item, '{interestPaid}', 'true');
            v_item := jsonb_set(v_item, '{journalEntryId}', to_jsonb(v_journal_id));
            
            IF NOT ((v_item->>'period')::TEXT = ANY(v_paid_periods)) THEN
                v_paid_periods := array_append(v_paid_periods, (v_item->>'period')::TEXT);
            END IF;
        END IF;

        v_new_schedule := v_new_schedule || v_item;
    END LOOP;

    UPDATE docs_loans SET 
        paid_periods = v_paid_periods,
        status = CASE WHEN array_length(v_paid_periods, 1) >= (v_loan.data->>'termMonths')::INT THEN 'PAID' ELSE status END,
        data = jsonb_set(jsonb_set(v_loan.data, '{amortizationSchedule}', v_new_schedule), '{amortization_schedule}', v_new_schedule),
        updated_at = NOW()
    WHERE id = p_loan_id;

    v_desc := 'Loan Payment: ' || COALESCE(v_loan.data->>'name', v_loan.data->>'number');
    
    SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code IN ('100100','1011') OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
    IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Cash/Bank account not found for this company'; END IF;

    IF v_is_received THEN
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE (code = '210100' OR name ILIKE '%Loan%Payable%') AND company_id = v_company_id LIMIT 1;
        IF v_loan_acc IS NULL THEN
            v_loan_acc := 'acc-loan-pay-' || v_company_id || '-' || substr(md5(random()::text), 1, 6);
            INSERT INTO docs_accounts (id, company_id, code, name, type, sub_type, data, updated_at)
            VALUES (v_loan_acc, v_company_id, '210100', 'Loans Payable', 'LIABILITY', 'LIABILITY', '{}'::jsonb, NOW());
        END IF;

        SELECT id INTO v_interest_acc FROM docs_accounts WHERE (code IN ('500208', '600000') OR name ILIKE '%Interest Expense%') AND company_id = v_company_id LIMIT 1;
        IF v_interest_acc IS NULL THEN
            v_interest_acc := 'acc-int-exp-' || v_company_id || '-' || substr(md5(random()::text), 1, 6);
            INSERT INTO docs_accounts (id, company_id, code, name, type, sub_type, data, updated_at)
            VALUES (v_interest_acc, v_company_id, '600000', 'Interest Expense', 'EXPENSE', 'EXPENSE', '{}'::jsonb, NOW());
        END IF;
    ELSE
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE (code = '100601' OR name ILIKE '%Loan%Receivable%') AND company_id = v_company_id LIMIT 1;
        IF v_loan_acc IS NULL THEN
            v_loan_acc := 'acc-loan-rec-' || v_company_id || '-' || substr(md5(random()::text), 1, 6);
            INSERT INTO docs_accounts (id, company_id, code, name, type, sub_type, data, updated_at)
            VALUES (v_loan_acc, v_company_id, '100601', 'Loans Receivable', 'ASSET', 'ASSET', '{}'::jsonb, NOW());
        END IF;
        
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE (code IN ('500208', '400500') OR name ILIKE '%Interest Income%') AND company_id = v_company_id LIMIT 1;
        IF v_interest_acc IS NULL THEN
            v_interest_acc := 'acc-int-inc-' || v_company_id || '-' || substr(md5(random()::text), 1, 6);
            INSERT INTO docs_accounts (id, company_id, code, name, type, sub_type, data, updated_at)
            VALUES (v_interest_acc, v_company_id, '400500', 'Interest Income', 'REVENUE', 'REVENUE', '{}'::jsonb, NOW());
        END IF;
    END IF;

    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_company_id, p_date::date, p_date::date, 'LOAN_PAYMENT', 'POSTED', v_loan.data->>'number' || '/P' || p_period::TEXT, '{}'::jsonb, NOW());

    IF v_is_received THEN
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr1', v_journal_id, v_company_id, v_loan_acc, v_contact_id, p_principal_to_pay, 0, v_desc);
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr2', v_journal_id, v_company_id, v_interest_acc, v_contact_id, p_interest_to_pay, 0, v_desc);
        END IF;
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, v_contact_id, 0, v_total_paid, v_desc);
    ELSE
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_cash_acc, v_contact_id, v_total_paid, 0, v_desc);
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr1', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, p_principal_to_pay, v_desc);
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr2', v_journal_id, v_company_id, v_interest_acc, v_contact_id, 0, p_interest_to_pay, v_desc);
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;
