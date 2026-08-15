import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    
    query1 = """
    CREATE OR REPLACE FUNCTION public.post_loan_rpc(p_loan_id text)
     RETURNS jsonb
     LANGUAGE plpgsql
     SECURITY DEFINER
    AS $function$
    DECLARE
        v_loan docs_loans%ROWTYPE;
        v_company_id TEXT;
        v_contact_id TEXT;
        v_amount NUMERIC;
        v_type TEXT;
        v_date DATE;
        v_cash_acc TEXT;
        v_loan_acc TEXT;
        v_journal_id TEXT;
        v_desc TEXT;
        v_name TEXT;
        v_number TEXT;
    BEGIN
        SELECT * INTO v_loan FROM docs_loans WHERE id = p_loan_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Loan not found';
        END IF;
        
        v_company_id := v_loan.company_id;
    
        v_contact_id := v_loan.contact_id;
        v_amount := v_loan.principal_amount;
        v_type := v_loan.type;
        v_date := v_loan.start_date;
        v_name := v_loan.name;
        v_number := v_loan.loan_number;
        
        IF v_amount IS NULL AND v_loan.amount IS NOT NULL THEN
            v_amount := v_loan.amount;
        END IF;
        
        v_desc := 'Loan Disbursement: ' || COALESCE(v_name, v_number);
        v_journal_id := 'JE-LOAN-' || UPPER(p_loan_id);
        
        SELECT id INTO v_cash_acc FROM docs_accounts WHERE (code = '100100' OR sub_type IN ('CASH', 'BANK') OR name ILIKE '%cash%') AND company_id = v_company_id LIMIT 1;
        IF v_cash_acc IS NULL THEN RAISE EXCEPTION 'Could not find cash/bank account for company'; END IF;
        
        IF v_type = 'RECEIVED' THEN
            SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '210100' AND company_id = v_company_id LIMIT 1;
            IF v_loan_acc IS NULL THEN RAISE EXCEPTION 'Could not find Loan Payable account (210100) for company'; END IF;
        ELSE
            SELECT id INTO v_loan_acc FROM docs_accounts WHERE code = '100601' AND company_id = v_company_id LIMIT 1;
            IF v_loan_acc IS NULL THEN RAISE EXCEPTION 'Could not find Loan Receivable account (100601) for company'; END IF;
        END IF;
        
        UPDATE docs_loans SET status = 'ACTIVE', updated_at = NOW(), journal_entry_id = v_journal_id WHERE id = p_loan_id;
        
        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
        VALUES (v_journal_id, v_company_id, v_date, v_date, 'LOAN', 'POSTED', v_number, NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'POSTED', updated_at = NOW();
        
        DELETE FROM docs_journal_lines WHERE journal_id = v_journal_id;
        
        IF v_type = 'RECEIVED' OR v_contact_id = 'c0cb513b-54d7-4f1e-9d05-48abfd79cb3a' THEN
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_cash_acc, v_amount, 0, v_desc);
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_loan_acc, v_contact_id, 0, v_amount, v_desc);
        ELSE
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description) VALUES (v_journal_id || '-dr', v_journal_id, v_company_id, v_loan_acc, v_contact_id, v_amount, 0, v_desc);
            INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description) VALUES (v_journal_id || '-cr', v_journal_id, v_company_id, v_cash_acc, 0, v_amount, v_desc);
        END IF;
        
        RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id);
    END;
    $function$;
    """
    
    await db.execute_raw(query1)
    # Let's also retroactively fix any active loans that have missing journal_entry_id but a journal actually exists
    await db.execute_raw("UPDATE docs_loans SET journal_entry_id = 'JE-LOAN-' || UPPER(id) WHERE status = 'ACTIVE' AND journal_entry_id IS NULL AND EXISTS (SELECT 1 FROM docs_journals WHERE id = 'JE-LOAN-' || UPPER(docs_loans.id))")
    print("Function replaced and historic loans updated successfully!")
    await db.disconnect()

asyncio.run(main())
