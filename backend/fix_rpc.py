import asyncio
from prisma import Prisma
import os

async def main():
    with open("../.env") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip().strip("\"").strip("'")
    db = Prisma()
    await db.connect()
    
    await db.execute_raw("DROP FUNCTION IF EXISTS post_loan_payment_rpc(text,integer,text,numeric,numeric);")
    sql = """
    CREATE OR REPLACE FUNCTION post_loan_payment_rpc(p_loan_id text, p_period integer, p_date text, p_interest_to_pay numeric DEFAULT 0, p_principal_to_pay numeric DEFAULT 0)
    RETURNS jsonb
    LANGUAGE plpgsql
    AS $function$
    DECLARE
        v_loan docs_loans%ROWTYPE;
        v_company_id TEXT;
        v_contact_id TEXT;
        v_is_received BOOLEAN;
        v_total NUMERIC;
        v_cash_acc TEXT;
        v_loan_acc TEXT;
        v_interest_acc TEXT;
        v_journal_id TEXT;
        v_desc TEXT;
    BEGIN
        SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    
        v_company_id := v_loan.company_id;
        v_contact_id := v_loan.contact_id;
        
        v_is_received := v_loan.type = 'RECEIVED';
        
        v_total := p_principal_to_pay + p_interest_to_pay;
    
        v_desc := 'Loan Payment Period ' || p_period::TEXT || ': ' || COALESCE(v_loan.name, v_loan.loan_number);
        v_journal_id := 'JE-LPAY-' || p_loan_id || '-' || p_period::TEXT;
    
        SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
        IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Cash/Bank account (100100) not found for this company'; END IF;
    
        IF v_is_received THEN
            -- Loan Payable Payment
            SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '210100' AND company_id = v_company_id LIMIT 1;
            
            -- Interest Expense
            SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '500208' AND company_id = v_company_id LIMIT 1;
            IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '600000' AND company_id = v_company_id LIMIT 1; END IF;
            IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE type = 'EXPENSE' AND name ILIKE '%interest%' AND company_id = v_company_id LIMIT 1; END IF;
            
            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
            VALUES (v_journal_id, v_company_id, p_date::date, p_date::date, 'LOAN', 'POSTED', 'PAY-'||p_period, NOW())
            ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();
    
            DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    
            -- Dr Loan Payable (Principal)
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-dr-prin', v_journal_id, v_company_id, v_loan_acc, v_contact_id, p_principal_to_pay, 0, v_desc);
            
            -- Dr Interest Expense
            IF p_interest_to_pay > 0 THEN
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
                VALUES (v_journal_id || '-dr-int', v_journal_id, v_company_id, v_interest_acc, v_contact_id, p_interest_to_pay, 0, v_desc);
            END IF;
    
            -- Cr Cash
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-cr-cash', v_journal_id, v_company_id, v_cash_acc, v_contact_id, 0, v_total, v_desc);
    
        ELSE
            -- Loan Receivable Payment
            SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '100601' AND company_id = v_company_id LIMIT 1;
            
            -- Interest Income
            SELECT id INTO v_interest_acc FROM docs_accounts WHERE code = '400200' AND company_id = v_company_id LIMIT 1;
            IF v_interest_acc IS NULL THEN SELECT id INTO v_interest_acc FROM docs_accounts WHERE type = 'INCOME' AND name ILIKE '%interest%' AND company_id = v_company_id LIMIT 1; END IF;
            
            INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
            VALUES (v_journal_id, v_company_id, p_date::date, p_date::date, 'LOAN', 'POSTED', 'PAY-'||p_period, NOW())
            ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();
    
            DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
    
            -- Dr Cash
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) 
            VALUES (v_journal_id || '-dr-cash', v_journal_id, v_company_id, v_cash_acc, v_contact_id, v_total, 0, v_desc);
    
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
            paid_periods = array_append(ARRAY(SELECT unnest(paid_periods) EXCEPT SELECT p_period::TEXT), p_period::TEXT),
            updated_at = NOW()
        WHERE id = p_loan_id;
    
        RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
    END;
    $function$;
    """
    await db.execute_raw(sql)
    print("Function replaced successfully!")
    await db.disconnect()

asyncio.run(main())
