ALTER TABLE docs_bills DROP CONSTRAINT IF EXISTS unq_bill_num_company;
ALTER TABLE docs_invoices DROP CONSTRAINT IF EXISTS unq_inv_num_company;
ALTER TABLE docs_credit_notes DROP CONSTRAINT IF EXISTS unq_cn_num_company;
ALTER TABLE docs_payments DROP CONSTRAINT IF EXISTS unq_pay_num_company;
ALTER TABLE docs_journals DROP CONSTRAINT IF EXISTS unq_jn_num_company;
