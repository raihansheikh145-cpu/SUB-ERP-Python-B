const fs = require('fs');
let code = fs.readFileSync('process_invoice.sql', 'utf8');

code = code.replace(
  /INSERT INTO docs_invoices \(\s*id, data, company_id, date, customer_id, status,\s*subtotal, discount_total, tax_total, total, invoice_number, updated_at\s*\)/,
  `INSERT INTO docs_invoices (
            id, data, company_id, date, customer_id, status, 
            subtotal, discount_total, tax_total, total, invoice_number, messages, updated_at
        )`
);

code = code.replace(
  /VALUES \(\s*v_invoice_id, p_invoice, v_company_id, v_date, v_customer_id, 'DRAFT',\s*v_inv_subtotal, v_inv_discount, v_inv_tax, v_inv_total, v_number, NOW\(\)\s*\)/,
  `VALUES (
            v_invoice_id, p_invoice, v_company_id, v_date, v_customer_id, 'DRAFT', 
            v_inv_subtotal, v_inv_discount, v_inv_tax, v_inv_total, v_number, COALESCE(p_invoice->'messages', '[]'::jsonb), NOW()
        )`
);

fs.writeFileSync('process_invoice.sql', code);
console.log('patched insert');
