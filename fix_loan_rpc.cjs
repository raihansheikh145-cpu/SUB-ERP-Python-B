const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const sql = `
CREATE OR REPLACE FUNCTION public.post_loan_payment_rpc(
    p_loan_id text, 
    p_period integer, 
    p_date text, 
    p_interest_to_pay numeric, 
    p_principal_to_pay numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    v_new_paid_periods TEXT[];
    v_accumulated NUMERIC := 0;
    v_new_status TEXT;
    v_current_principal NUMERIC := 0;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    v_company_id := v_loan.company_id;
    
    SELECT role INTO v_user_role FROM company_users WHERE company_id = (v_company_id)::uuid AND user_id = v_uid;
    IF v_user_role IS NULL THEN RAISE EXCEPTION 'Access denied to company'; END IF;
    
    v_contact_id := (v_loan.data->>'contactId');
    IF v_contact_id IS NULL THEN v_contact_id := v_loan.contact_id; END IF;
    
    v_is_received := (v_loan.data->>'type') = 'RECEIVED';
    v_schedule := v_loan.data->'amortizationSchedule';
    v_principal := 0;
    
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
        IF (v_item->>'period')::INT = p_period THEN
            v_current_principal := (v_item->>'principal')::NUMERIC;
        END IF;
    END LOOP;
    
    -- If custom principal is provided, use it
    IF p_principal_to_pay IS NOT NULL THEN
        v_principal := p_principal_to_pay;
    ELSE
        v_principal := v_current_principal;
    END IF;
    
    v_total := v_principal + COALESCE(p_interest_to_pay, 0);
    v_desc := 'Loan Payment: ' || COALESCE(v_loan.data->>'name', v_loan.data->>'number');
    v_journal_id := 'JE-LPAY-' || p_loan_id || '-' || p_period::TEXT || '-' || extract(epoch from now())::int::text;
    
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
    IF v_loan_acc IS NULL THEN RAISE EXCEPTION 'Loan principal account not found'; END IF;
    
    v_new_paid_periods := COALESCE(v_loan.paid_periods, ARRAY[]::TEXT[]);
    v_accumulated := 0;
    
    IF NOT p_period::TEXT = ANY(v_new_paid_periods) THEN
        v_new_paid_periods := array_append(v_new_paid_periods, p_period::TEXT);
    END IF;
    
    v_accumulated := v_principal - v_current_principal;
    
    IF v_accumulated > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_schedule) LOOP
            IF NOT (v_item->>'period')::TEXT = ANY(v_new_paid_periods) THEN
                IF v_accumulated >= (v_item->>'principal')::NUMERIC - 0.01 THEN
                    v_new_paid_periods := array_append(v_new_paid_periods, (v_item->>'period')::TEXT);
                    v_accumulated := v_accumulated - (v_item->>'principal')::NUMERIC;
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    v_new_status := v_loan.status;
    IF array_length(v_new_paid_periods, 1) >= (v_loan.data->>'termMonths')::INT THEN
        v_new_status := 'PAID';
    END IF;
    
    UPDATE docs_loans SET 
        paid_periods = v_new_paid_periods,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_loan_id;
    
    INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data, updated_at)
    VALUES (v_journal_id, v_company_id, p_date, p_date, 'LOAN_PAYMENT', 'POSTED', v_loan.data->>'number' || '/P' || p_period::TEXT, '{}'::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();
    
    DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    
    IF v_is_received THEN
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr1', v_journal_id, v_company_id, v_loan_acc, v_contact_id, v_principal, 0, v_desc);
        IF COALESCE(p_interest_to_pay, 0) > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr2', v_journal_id, v_company_id, v_interest_acc, v_contact_id, p_interest_to_pay, 0, v_desc);
        END IF;
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, v_contact_id, 0, v_total, v_desc);
    ELSE
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_cash_acc, v_contact_id, v_total, 0, v_desc);
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr1', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, v_principal, v_desc);
        IF COALESCE(p_interest_to_pay, 0) > 0 THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr2', v_journal_id, v_company_id, v_interest_acc, v_contact_id, 0, p_interest_to_pay, v_desc);
        END IF;
    END IF;
    
    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'paid_periods', v_new_paid_periods);
END;
$$;
  `;
  await client.query(sql);
  console.log("Updated post_loan_payment_rpc");
  await client.end();
}
run();
