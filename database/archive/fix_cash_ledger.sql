CREATE OR REPLACE FUNCTION public.get_cash_ledger(p_company_ids text[], p_start_date text, p_end_date text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
AS $function$
    DECLARE
        v_opening NUMERIC := 0;
        v_records JSONB;
        v_start DATE;
        v_end DATE;
    BEGIN
        IF p_start_date IS NULL OR p_start_date = '' THEN
            v_start := '1970-01-01'::DATE;
        ELSE
            v_start := p_start_date::date;
        END IF;
        
        IF p_end_date IS NULL OR p_end_date = '' THEN
            v_end := '2100-01-01'::DATE;
        ELSE
            v_end := p_end_date::date;
        END IF;

        -- Calculate Opening Balance directly from journal lines
        SELECT COALESCE(SUM(jl.debit - jl.credit), 0) INTO v_opening
        FROM docs_journal_lines jl
        JOIN docs_journals j ON j.id = jl.journal_id
        JOIN docs_accounts a ON a.id = jl.account_id
        WHERE j.status = 'POSTED'
          AND j.date < v_start
          AND (a.code IN ('100100', '1011') OR a.type IN ('CASH', 'BANK') OR a.sub_type IN ('CASH', 'BANK'))
          AND (array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids));

        -- Fetch Transactions directly from journal lines
        WITH cash_lines AS (
            SELECT 
                jl.id AS line_id,
                j.id AS journal_id,
                j.date,
                COALESCE(j.reference_number, j.reference, j.journal_number) as reference_number,
                j.journal_type,
                COALESCE(jl.description, j.description, '') AS description,
                jl.debit,
                jl.credit,
                (jl.debit - jl.credit) AS impact,
                j.company_id,
                j.created_at,
                COALESCE(
                  (SELECT c_inner.name FROM docs_contacts c_inner WHERE c_inner.id = jl.contact_id LIMIT 1),
                  (SELECT c_inner.name FROM docs_contacts c_inner INNER JOIN docs_journal_lines jl2 ON jl2.contact_id = c_inner.id WHERE jl2.journal_id = j.id AND jl2.contact_id IS NOT NULL LIMIT 1),
                  (SELECT c_inner.name FROM docs_invoices i LEFT JOIN docs_contacts c_inner ON i.customer_id = c_inner.id WHERE COALESCE(i.journal_entry_id, i.data->>'journalEntryId', 'JE-' || UPPER(REPLACE(i.id, 'INV-', ''))) = j.id OR 'JE-CPAY-' || UPPER(REPLACE(REPLACE('PAY-AUTO-' || i.id, 'PAY-', ''), 'PAY-', '')) = j.id LIMIT 1),
                  (SELECT c_inner.name FROM docs_bills b LEFT JOIN docs_contacts c_inner ON b.vendor_id = c_inner.id WHERE COALESCE(b.journal_entry_id, b.data->>'journalEntryId') = j.id OR 'JE-VPAY-' || UPPER(REPLACE(REPLACE('PAY-AUTO-' || b.id, 'PAY-', ''), 'PAY-', '')) = j.id LIMIT 1),
                  (SELECT c_inner.name FROM docs_payments p LEFT JOIN docs_contacts c_inner ON p.contact_id = c_inner.id WHERE COALESCE(p.data->>'journalEntryId', 'JE-' || CASE WHEN p.type IN ('RECEIPT', 'REFUND', 'COLLECTION') THEN 'CPAY' ELSE 'VPAY' END || '-' || replace(replace(UPPER(p.id), 'PAY-', ''), 'PAY-', '')) = j.id OR j.id = 'PAY-AUTO-' || p.id OR j.id = p.id LIMIT 1),
                  'Various'
                ) AS partner_name,
                COALESCE(
                    (SELECT name FROM docs_users WHERE id = j.created_by_id), 
                     (SELECT username FROM docs_users WHERE id = j.created_by_id), 
                     j.data->>'preparedBy', 
                     'System'
                ) AS prepared_by
            FROM docs_journal_lines jl
            JOIN docs_journals j ON j.id = jl.journal_id
            JOIN docs_accounts a ON a.id = jl.account_id
            WHERE j.status = 'POSTED'
              AND j.date >= v_start AND j.date <= v_end
              AND (a.code IN ('100100', '1011') OR a.type IN ('CASH', 'BANK') OR a.sub_type IN ('CASH', 'BANK'))
              AND (array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids))
        )
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'line_id', line_id,
                'journal_id', journal_id,
                'date', date,
                'reference_number', reference_number,
                'journal_type', journal_type,
                'description', description,
                'debit', debit,
                'credit', credit,
                'impact', impact,
                'company_id', company_id,
                'created_at', created_at,
                'partner_name', partner_name,
                'prepared_by', prepared_by
            ) ORDER BY date ASC, created_at ASC, journal_id ASC, line_id ASC
        ), '[]'::jsonb) INTO v_records
        FROM cash_lines;

        RETURN jsonb_build_object(
            'opening_balance', v_opening,
            'transactions', v_records
        );
    END;
$function$;
