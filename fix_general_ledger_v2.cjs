const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const sql = `
CREATE OR REPLACE FUNCTION public.get_general_ledger_v2(p_company_id text, p_account_id text, p_start_date date, p_end_date date)
 RETURNS TABLE(date date, type text, ref text, description text, contact_name text, account_name text, debit numeric, credit numeric, balance numeric, is_opening boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
    DECLARE
        v_opening_bal NUMERIC := 0;
    BEGIN
        -- Calculate Opening Balance
        SELECT COALESCE(SUM(al.debit - al.credit), 0) INTO v_opening_bal
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND al.account_id = p_account_id
          AND j.status = 'POSTED'
          AND j.date < p_start_date;

        -- Return Opening Balance row
        RETURN QUERY SELECT 
            p_start_date, 
            'OPENING'::TEXT, 
            'Opening Balance'::TEXT, 
            ''::TEXT, 
            ''::TEXT, 
            ''::TEXT, 
            0::NUMERIC, 
            0::NUMERIC, 
            v_opening_bal,
            TRUE;

        -- Return Transactions
        RETURN QUERY
        SELECT 
            j.date,
            CASE 
              WHEN j.journal_type = 'INV' AND UPPER(COALESCE(i.invoice_number, j.reference, j.reference_number, j.id)) NOT LIKE 'INV-%' THEN 'INV-' || COALESCE(i.invoice_number, j.reference, j.reference_number, j.id)
              WHEN j.journal_type = 'BILL' AND UPPER(COALESCE(b.bill_number, j.reference, j.reference_number, j.id)) NOT LIKE 'BIL-%' AND UPPER(COALESCE(b.bill_number, j.reference, j.reference_number, j.id)) NOT LIKE 'BILL-%' THEN 'BIL-' || COALESCE(b.bill_number, j.reference, j.reference_number, j.id)
              WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') AND UPPER(COALESCE(p.payment_number, j.reference, j.reference_number, j.id)) NOT LIKE 'PAY-%' THEN 'PAY-' || COALESCE(p.payment_number, j.reference, j.reference_number, j.id)
              WHEN j.journal_type IN ('LOAN', 'LOAN_PAYMENT') AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'LOAN-%' AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'LN-%' THEN 'LOAN-' || COALESCE(j.reference, j.reference_number, j.id)
              WHEN j.journal_type = 'STOCK_ADJ' AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'ADJ-%' THEN 'ADJ-' || COALESCE(j.reference, j.reference_number, j.id)
              WHEN j.journal_type = 'PAYROLL' AND UPPER(COALESCE(j.reference, j.reference_number, j.id)) NOT LIKE 'PR-%' THEN 'PR-' || COALESCE(j.reference, j.reference_number, j.id)
              ELSE COALESCE(j.journal_type, 'JE')
            END AS type,
            COALESCE(i.invoice_number, b.bill_number, p.payment_number, j.reference, j.reference_number, j.id) AS ref,
            COALESCE(NULLIF(al.description, ''), j.description, '') AS description,
            COALESCE(c.name, '') AS contact_name,
            COALESCE(a.name, a.code, '') AS account_name,
            al.debit,
            al.credit,
            0::NUMERIC AS balance,
            FALSE AS is_opening
        FROM docs_journal_lines al
        JOIN docs_journals j ON al.journal_id = j.id
        LEFT JOIN docs_contacts c ON al.contact_id = c.id
        LEFT JOIN docs_accounts a ON al.account_id = a.id
        LEFT JOIN docs_invoices i ON j.journal_type = 'INV' AND i.journal_entry_id = j.id
        LEFT JOIN docs_bills b ON j.journal_type = 'BILL' AND b.journal_entry_id = j.id
        LEFT JOIN docs_payments p ON j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY') AND p.data->>'journalEntryId' = j.id
        WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
          AND al.account_id = p_account_id
          AND j.status = 'POSTED'
          AND j.date >= p_start_date 
          AND j.date <= p_end_date
        ORDER BY j.date ASC, j.created_at ASC;
    END;
$$;
  `;
  await client.query(sql);
  console.log("Updated get_general_ledger_v2");
  await client.end();
}
run();
