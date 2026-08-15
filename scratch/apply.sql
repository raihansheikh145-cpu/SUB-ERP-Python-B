CREATE OR REPLACE FUNCTION public.post_loan_payment_rpc(p_loan_id text, p_period integer, p_principal_to_pay numeric, p_interest_to_pay numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_loan docs_loans%ROWTYPE;
    v_company_id TEXT;
    v_contact_id TEXT;
    v_type TEXT;
    v_cash_acc TEXT;
    v_loan_acc TEXT;
    v_interest_acc TEXT;
    v_journal_id TEXT;
    v_desc TEXT;
    v_total NUMERIC;
    v_uid uuid;
    v_user_role TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found';
    END IF;
    
    v_company_id := v_loan.company_id;
    
    SELECT role INTO v_user_role FROM company_users WHERE company_id = (v_company_id)::uuid AND user_id = v_uid;
    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Access denied to company';
    END IF;

    v_contact_id := v_loan.contact_id;
    v_type := v_loan.type;
    v_total := p_principal_to_pay + p_interest_to_pay;
    
    v_desc := 'Loan Payment Period ' || p_period || ': ' || COALESCE(v_loan.name, v_loan.loan_number);
    v_journal_id := 'JE-LOAN-PAY-' || p_period || '-' || UPPER(p_loan_id);
    
    SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
    IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Could not find cash/bank account'; END IF;
    
    IF v_type = 'RECEIVED' THEN
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '210100' AND company_id = v_company_id LIMIT 1;
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '600100' AND company_id = v_company_id LIMIT 1;
        
        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
        VALUES (v_journal_id, v_company_id, CURRENT_DATE, CURRENT_DATE, 'LOAN_PAYMENT', 'POSTED', 'PAY-' || p_period, NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;

        -- Cr Cash (No contact_id)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) 
        VALUES (v_journal_id || '-cr-cash', v_journal_id, v_company_id, v_cash_acc, 0, v_total, v_desc);

        -- Dr Loan Payable (Principal)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
        VALUES (v_journal_id || '-dr-prin', v_journal_id, v_company_id, v_loan_acc, v_contact_id, p_principal_to_pay, 0, v_desc);
        
        -- Dr Interest Expense
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-dr-int', v_journal_id, v_company_id, v_interest_acc, v_contact_id, p_interest_to_pay, 0, v_desc);
        END IF;

    ELSE
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '100601' AND company_id = v_company_id LIMIT 1;
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '410100' AND company_id = v_company_id LIMIT 1;
        
        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
        VALUES (v_journal_id, v_company_id, CURRENT_DATE, CURRENT_DATE, 'LOAN_PAYMENT', 'POSTED', 'PAY-' || p_period, NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();

        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;

        -- Dr Cash (No contact_id)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) 
        VALUES (v_journal_id || '-dr-cash', v_journal_id, v_company_id, v_cash_acc, v_total, 0, v_desc);

        -- Cr Loan Receivable (Principal)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
        VALUES (v_journal_id || '-cr-prin', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, p_principal_to_pay, v_desc);
        
        -- Cr Interest Income
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-cr-int', v_journal_id, v_company_id, v_interest_acc, v_contact_id, 0, p_interest_to_pay, v_desc);
        END IF;
    END IF;

    -- Add period to paidPeriods
    UPDATE docs_loans SET 
        paid_periods = array_append(ARRAY(SELECT unnest(paid_periods) EXCEPT SELECT p_period), p_period),
        updated_at = NOW()
    WHERE id = p_loan_id;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
END;
$function$;
