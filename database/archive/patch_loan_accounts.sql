DO $$
DECLARE
    rec RECORD;
    v_loan_acc uuid;
BEGIN
    FOR rec IN SELECT * FROM docs_companies LOOP
        -- Ensure 100601 exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '100601') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, data, created_at, updated_at) 
            VALUES (v_loan_acc, rec.id, '100601', 'Loan Receivable', 'ASSET', 
                    jsonb_build_object('id', v_loan_acc, 'code', '100601', 'name', 'Loan Receivable', 'type', 'ASSET', 'companyId', rec.id), NOW(), NOW());
        END IF;

        -- Ensure 210100 exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '210100') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, data, created_at, updated_at) 
            VALUES (v_loan_acc, rec.id, '210100', 'Loan Payable', 'LIABILITY', 
                    jsonb_build_object('id', v_loan_acc, 'code', '210100', 'name', 'Loan Payable', 'type', 'LIABILITY', 'companyId', rec.id), NOW(), NOW());
        END IF;

        -- Ensure 500208 (Interest Expense) exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '500208') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, data, created_at, updated_at) 
            VALUES (v_loan_acc, rec.id, '500208', 'Interest Expense', 'EXPENSE', 
                    jsonb_build_object('id', v_loan_acc, 'code', '500208', 'name', 'Interest Expense', 'type', 'EXPENSE', 'companyId', rec.id), NOW(), NOW());
        END IF;

        -- Ensure 400200 (Interest Income) exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '400200') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, data, created_at, updated_at) 
            VALUES (v_loan_acc, rec.id, '400200', 'Interest Income', 'REVENUE', 
                    jsonb_build_object('id', v_loan_acc, 'code', '400200', 'name', 'Interest Income', 'type', 'REVENUE', 'companyId', rec.id), NOW(), NOW());
        END IF;
        
        -- Ensure 210101 (Short-Term Loan Payable) exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '210101') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, data, created_at, updated_at) 
            VALUES (v_loan_acc, rec.id, '210101', 'Short-Term Loan Payable', 'LIABILITY', 
                    jsonb_build_object('id', v_loan_acc, 'code', '210101', 'name', 'Short-Term Loan Payable', 'type', 'LIABILITY', 'companyId', rec.id), NOW(), NOW());
        END IF;

        -- Ensure 100602 (Short-Term Loan Receivable) exists
        IF NOT EXISTS (SELECT 1 FROM docs_accounts WHERE company_id = rec.id AND code = '100602') THEN
            v_loan_acc := gen_random_uuid();
            INSERT INTO docs_accounts (id, company_id, code, name, type, data, created_at, updated_at) 
            VALUES (v_loan_acc, rec.id, '100602', 'Short-Term Loan Receivable', 'ASSET', 
                    jsonb_build_object('id', v_loan_acc, 'code', '100602', 'name', 'Short-Term Loan Receivable', 'type', 'ASSET', 'companyId', rec.id), NOW(), NOW());
        END IF;

    END LOOP;
END;
$$;
