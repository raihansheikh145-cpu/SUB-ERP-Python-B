const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  const sql = `
CREATE OR REPLACE FUNCTION public.get_general_ledger(
    p_company_ids text[] DEFAULT NULL::text[], 
    p_account_ids text[] DEFAULT NULL::text[], 
    p_partner_ids text[] DEFAULT NULL::text[], 
    p_start_date date DEFAULT '1970-01-01'::date, 
    p_end_date date DEFAULT '2099-12-31'::date, 
    p_partner_type text DEFAULT NULL::text
) RETURNS TABLE(partner_id text, journal_id text, journal_date date, account_name text, reference text, description text, responsible_name text, debit numeric, credit numeric) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            NULLIF(al.contact_id, ''), 
            (
                SELECT jl_inner.contact_id 
                FROM docs_journal_lines jl_inner 
                WHERE jl_inner.journal_id = j.id AND NULLIF(jl_inner.contact_id, '') IS NOT NULL 
                LIMIT 1
            ),
            NULLIF(j.data->>'contactId', ''),
            NULLIF(j.data->>'customerId', ''),
            NULLIF(j.data->>'vendorId', ''),
            NULLIF(j.data->>'partnerId', ''),
            CASE 
                WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'contact-cash-sale-global'
                ELSE NULL 
            END
        ) AS partner_id,
        j.id AS journal_id,
        j.date AS journal_date,
        COALESCE(a.name, 'Unknown Account') AS account_name,
        CASE 
            WHEN j.journal_type = 'INV' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'INV-%' THEN 'INV-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            WHEN j.journal_type = 'BILL' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'BIL-%' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'BILL-%' THEN 'BIL-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            WHEN j.journal_type IN ('CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'PAYMENT') AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'PAY-%' THEN 'PAY-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            WHEN j.journal_type = 'CREDIT_NOTE' AND UPPER(COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)) NOT LIKE 'CN-%' THEN 'CN-' || COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
            ELSE COALESCE(NULLIF(j.reference, ''), NULLIF(j.reference_number, ''), j.id)
        END AS reference,
        COALESCE(al.description, j.description, '') AS description,
        COALESCE(u.name, u.username, j.data->>'preparedBy', 'System') AS responsible_name,
        COALESCE(al.debit, 0)::NUMERIC AS debit,
        COALESCE(al.credit, 0)::NUMERIC AS credit
    FROM docs_journal_lines al
    JOIN docs_journals j ON al.journal_id = j.id
    LEFT JOIN docs_accounts a ON al.account_id = a.id
    LEFT JOIN docs_users u ON j.created_by_id = u.id
    WHERE (p_company_ids IS NULL OR array_length(p_company_ids, 1) IS NULL OR j.company_id = ANY(p_company_ids))
      AND (p_account_ids IS NULL OR array_length(p_account_ids, 1) IS NULL OR al.account_id = ANY(p_account_ids))
      AND (
          p_partner_ids IS NULL 
          OR array_length(p_partner_ids, 1) IS NULL
          OR COALESCE(
                 al.contact_id, 
                 (
                     SELECT jl_inner.contact_id 
                     FROM docs_journal_lines jl_inner 
                     WHERE jl_inner.journal_id = j.id AND jl_inner.contact_id IS NOT NULL 
                     LIMIT 1
                 ),
                 j.data->>'contactId',
                 j.data->>'customerId',
                 j.data->>'vendorId',
                 j.data->>'partnerId',
                 CASE 
                      WHEN j.journal_type IN ('INV', 'BILL', 'CUST_PAY', 'VEND_PAY', 'CPAY', 'VPAY', 'CREDIT_NOTE') THEN 'contact-cash-sale-global'
                     ELSE NULL 
                  END
             ) = ANY(p_partner_ids)
      )
      AND j.status = 'POSTED'
      AND j.date >= p_start_date 
      AND j.date <= p_end_date
      AND (
          p_partner_type IS NULL
          OR (
              p_partner_type = 'CUSTOMER' 
              AND (
                  LOWER(a.sub_type) = 'accounts_receivable'
                  OR LOWER(a.sub_type) = 'receivable'
                  OR LOWER(a.sub_type) = 'accounts receivable'
                  OR a.code IN ('100201', '100200', '100202', '100203', '100204', '100205')
                  OR a.code LIKE '1002%'
                  OR LOWER(a.name) ILIKE '%accounts receivable%'
                  OR LOWER(a.name) ILIKE '%customer advance%'
                  OR LOWER(a.name) ILIKE '%advance from customer%'
                  OR LOWER(a.name) ILIKE '%advance customer%'
                  OR LOWER(a.name) ILIKE '%customer prepayment%'
                  OR LOWER(a.name) ILIKE '%customer advance/deposit%'
                  OR LOWER(a.name) ILIKE '%debtor%'
                  OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%receivable%')
                  OR a.data->>'type' = 'RECEIVABLE'
              )
          )
          OR (
              p_partner_type = 'VENDOR' 
              AND (
                  LOWER(a.sub_type) = 'accounts_payable'
                  OR LOWER(a.sub_type) = 'payable'
                  OR LOWER(a.sub_type) = 'accounts payable'
                  OR a.code IN ('200101', '200100', '200102', '200103', '200104', '200105')
                  OR a.code LIKE '2001%'
                  OR LOWER(a.name) ILIKE '%accounts payable%'
                  OR LOWER(a.name) ILIKE '%vendor advance%'
                  OR LOWER(a.name) ILIKE '%advance to vendor%'
                  OR LOWER(a.name) ILIKE '%vendor prepayment%'
                  OR LOWER(a.name) ILIKE '%advance vendor%'
                  OR LOWER(a.name) ILIKE '%supplier advance%'
                  OR LOWER(a.name) ILIKE '%advance to supplier%'
                  OR LOWER(a.name) ILIKE '%creditor%'
                  OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%payable%')
                  OR a.data->>'type' = 'PAYABLE'
              )
          )
          OR (
              p_partner_type = 'EMPLOYEE' AND (
                  a.code = '100205' OR LOWER(a.name) ILIKE '%employee%'
              )
          )
          OR (
              p_partner_type = 'LOAN_RECEIVABLE' AND (
                  a.code = '100601' OR LOWER(a.name) ILIKE '%loan receivable%' OR (a.type = 'ASSET' AND LOWER(a.name) ILIKE '%loan%')
              )
          )
          OR (
              p_partner_type = 'LOAN_PAYABLE' AND (
                  a.code = '210100' OR LOWER(a.name) ILIKE '%loan payable%' OR (a.type = 'LIABILITY' AND LOWER(a.name) ILIKE '%loan%')
              )
          )
      )
    ORDER BY j.date ASC, 5 ASC, COALESCE(j.created_at, j.updated_at) ASC, j.id ASC, al.id ASC;
END;
$$;
  `;
  await client.query(sql);
  console.log("Updated get_general_ledger");
  await client.end();
}
run();
