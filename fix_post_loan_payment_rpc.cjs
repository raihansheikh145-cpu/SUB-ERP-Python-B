const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  
  const sql = `
CREATE OR REPLACE FUNCTION public.post_loan_payment_rpc(p_loan_id text, p_period integer, p_date date, p_interest_to_pay numeric, p_principal_to_pay numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_loan RECORD;
    v_principal NUMERIC;
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
    v_total NUMERIC;
    v_uid uuid;
    v_user_role TEXT;
    v_total_paid_so_far NUMERIC := 0;
    v_paid_periods TEXT[];
    v_overpayment NUMERIC := 0;
    v_new_loan_id TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    v_company_id := v_loan.company_id;
    
    -- Verify user has access to this company
    SELECT role INTO v_user_role FROM company_users WHERE company_id = (v_company_id)::uuid AND user_id = v_uid;
    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Access denied to company';
    END IF;
    v_contact_id := (v_loan.data->>'contactId');
    IF v_contact_id IS NULL THEN v_contact_id := v_loan.contact_id; END IF;
    
    v_is_received := (v_loan.data->>'type') = 'RECEIVED';
    
    v_schedule := v_loan.data->'amortizationSchedule';
    v_principal := p_principal_to_pay; -- use the passed parameter instead of schedule element if possible
    
    v_paid_periods := COALESCE(v_loan.paid_periods, ARRAY[]::TEXT[]);
    
    -- calculate already paid principal by iterating schedule
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
        IF (v_item->>'period')::TEXT = ANY(v_paid_periods) THEN
            v_total_paid_so_far := v_total_paid_so_far + (v_item->>'principal')::NUMERIC;
        END IF;
    END LOOP;
    
    -- add the current payment
    v_total_paid_so_far := v_total_paid_so_far + v_principal;
    
    IF v_total_paid_so_far > v_loan.principal_amount THEN
        v_overpayment := v_total_paid_so_far - v_loan.principal_amount;
        v_principal := v_principal - v_overpayment; -- adjust principal down to exactly what pays off the loan
    END IF;

    v_total := v_principal + p_interest_to_pay + v_overpayment;
    
    v_desc := 'Loan Payment Period ' || p_period::TEXT || ': ' || COALESCE(v_loan.data->>'name', v_loan.data->>'number');
    v_journal_id := 'JE-LPAY-' || p_loan_id || '-' || p_period::TEXT;
    SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
    IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Cash/Bank account (100100) not found for this company'; END IF;
    IF v_is_received THEN
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '210100' AND company_id = v_company_id LIMIT 1;
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '500208' AND company_id = v_company_id LIMIT 1;
        IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '600000' AND company_id = v_company_id LIMIT 1; END IF;
    ELSE
        SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '100601' AND company_id = v_company_id LIMIT 1;
        SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '500208' AND company_id = v_company_id LIMIT 1;
        IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '400500' AND company_id = v_company_id LIMIT 1; END IF;
    END IF;
    IF v_loan_acc IS NULL THEN RAISE EXCEPTION 'Loan principal account (210100 or 100601) not found for this company'; END IF;
    IF p_interest_to_pay > 0 AND v_interest_acc IS NULL THEN RAISE EXCEPTION 'Interest account not found for this company'; END IF;
    
    -- Mark as PAID if overpayment happened or term reached
    UPDATE docs_loans SET 
        paid_periods = array_append(COALESCE(paid_periods, ARRAY[]::TEXT[]), p_period::TEXT),
        status = CASE WHEN (v_total_paid_so_far >= v_loan.principal_amount) OR (array_length(array_append(COALESCE(paid_periods, ARRAY[]::TEXT[]), p_period::TEXT), 1) = (v_loan.data->>'termMonths')::INT) THEN 'PAID' ELSE status END,
        updated_at = NOW()
    WHERE id = p_loan_id;
    
    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_company_id, p_date, p_date, 'LOAN_PAYMENT', 'POSTED', v_loan.data->>'number' || '/P' || p_period::TEXT, '{}'::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();
    
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    IF v_is_received THEN
        -- Cash goes OUT to pay back the loan (Debit Loan Payable, Credit Cash)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr1', v_journal_id, v_company_id, v_loan_acc, v_contact_id, v_principal, 0, v_desc);
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr2', v_journal_id, v_company_id, v_interest_acc, v_contact_id, p_interest_to_pay, 0, v_desc);
        END IF;
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, v_contact_id, 0, v_total, v_desc);
    ELSE
        -- Cash comes IN from the borrower (Debit Cash, Credit Loan Receivable)
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_cash_acc, v_contact_id, v_total, 0, v_desc);
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr1', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, v_principal, v_desc);
        IF p_interest_to_pay > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr2', v_journal_id, v_company_id, v_interest_acc, v_contact_id, 0, p_interest_to_pay, v_desc);
        END IF;
    END IF;
    
    -- Auto-create new loan for overpayment
    IF v_overpayment > 0 THEN
        v_new_loan_id := 'loan-op-' || gen_random_uuid()::text;
        -- If original was RECEIVED (Payable), overpayment means we paid them more, so they owe us -> GIVEN (Receivable)
        -- If original was GIVEN (Receivable), overpayment means they paid us more, so we owe them -> RECEIVED (Payable)
        
        INSERT INTO docs_loans (
            id, company_id, loan_number, date, amount, status, name, type, 
            contact_id, start_date, term_months, interest_rate, interest_type, 
            principal_amount, updated_at, data
        ) VALUES (
            v_new_loan_id, v_company_id, 'OP-' || (v_loan.data->>'number'), p_date, v_overpayment, 'ACTIVE', 'Overpayment for ' || COALESCE(v_loan.data->>'name', ''), 
            CASE WHEN v_is_received THEN 'GIVEN' ELSE 'RECEIVED' END,
            v_contact_id, p_date, 1, 0, 'FIXED', v_overpayment, NOW(),
            jsonb_build_object(
                'number', 'OP-' || (v_loan.data->>'number'),
                'amount', v_overpayment,
                'principalAmount', v_overpayment,
                'type', CASE WHEN v_is_received THEN 'GIVEN' ELSE 'RECEIVED' END,
                'status', 'ACTIVE',
                'name', 'Overpayment for ' || COALESCE(v_loan.data->>'name', ''),
                'contactId', v_contact_id,
                'date', p_date,
                'startDate', p_date,
                'termMonths', 1,
                'interestRate', 0,
                'interestType', 'FIXED'
            )
        );
        
        -- Post the new loan journal
        PERFORM post_loan_rpc(v_new_loan_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'overpayment', v_overpayment, 'new_loan_id', v_new_loan_id);
END;
$function$;
  `;
  
  await client.query(sql);
  console.log("Updated post_loan_payment_rpc");
  await client.end();
}
run();
