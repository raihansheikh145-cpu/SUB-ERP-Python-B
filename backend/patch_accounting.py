import os

file_path = "backend/app/services/accounting_service.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Line 56: docs_accounts insert
content = content.replace(
    "INSERT INTO docs_accounts (id, company_id, code, name, type, data)",
    "INSERT INTO docs_accounts (id, company_id, code, name, type)"
)
content = content.replace(
    "VALUES ($1, $2, $3, $4, $5, $6::jsonb) ON CONFLICT DO NOTHING\n        \"\"\", new_id, company_id, criteria[\"default_code\"], criteria[\"default_name\"], criteria[\"type\"],\n        json.dumps({",
    "VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING\n        \"\"\", new_id, company_id, criteria[\"default_code\"], criteria[\"default_name\"], criteria[\"type\"]) #"
)

# Line 95
content = content.replace(
    'await tx.execute_raw("UPDATE docs_invoices SET invoice_number = $1, data = $2::jsonb WHERE id = $3", inv_num, json.dumps(data_obj, default=str), invoice_id)',
    'await tx.execute_raw("UPDATE docs_invoices SET invoice_number = $1 WHERE id = $2", inv_num, invoice_id)'
)

# Line 103: docs_journals insert
content = content.replace(
    "INSERT INTO docs_journals (id, company_id, date, journal_date, reference, reference_number, description, status, created_by_id, journal_type, data)",
    "INSERT INTO docs_journals (id, company_id, date, journal_date, reference, reference_number, description, status, created_by_id, journal_type)"
)
content = content.replace(
    "VALUES ($1, $2, $3::date, $3::date, $4, $5, $6, 'DRAFT', NULL, 'INV', $7::jsonb)",
    "VALUES ($1, $2, $3::date, $3::date, $4, $5, $6, 'DRAFT', NULL, 'INV')"
)
content = content.replace(
    "ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, journal_date = EXCLUDED.journal_date, reference = EXCLUDED.reference, reference_number = EXCLUDED.reference_number, description = EXCLUDED.description, status = 'DRAFT', data = EXCLUDED.data",
    "ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, journal_date = EXCLUDED.journal_date, reference = EXCLUDED.reference, reference_number = EXCLUDED.reference_number, description = EXCLUDED.description, status = 'DRAFT'"
)
content = content.replace(
    '\"\"\", journal_id, effective_company_id, inv_date, inv_num, inv_num, f"Invoice {inv_num}", json.dumps({"source": "INV", "journalEntryId": journal_id}, default=str))',
    '\"\"\", journal_id, effective_company_id, inv_date, inv_num, inv_num, f"Invoice {inv_num}")'
)

# Line 284
content = content.replace(
    'await tx.execute_raw("UPDATE docs_invoices SET total = $1, data = $2::jsonb WHERE id = $3", total_debit, json.dumps(data_obj, default=str), invoice_id)',
    'await tx.execute_raw("UPDATE docs_invoices SET total = $1 WHERE id = $2", total_debit, invoice_id)'
)

# Line 293
content = content.replace(
    'await tx.execute_raw("UPDATE docs_invoices SET status = \'POSTED\', journal_entry_id = $1, data = $2::jsonb WHERE id = $3", journal_id, json.dumps(data_obj, default=str), invoice_id)',
    'await tx.execute_raw("UPDATE docs_invoices SET status = \'POSTED\', journal_entry_id = $1 WHERE id = $2", journal_id, invoice_id)'
)

# Line 327: docs_payments insert
content = content.replace(
    "INSERT INTO docs_payments (id, company_id, date, contact_id, status, type, amount, payment_date, applied_invoices, data, updated_at)",
    "INSERT INTO docs_payments (id, company_id, date, contact_id, status, type, amount, payment_date, applied_invoices, updated_at)"
)
content = content.replace(
    "VALUES ($1, $2, $3::date, $4, 'DRAFT', 'RECEIPT', $5, $6::date, $7::jsonb, $8::jsonb, NOW())",
    "VALUES ($1, $2, $3::date, $4, 'DRAFT', 'RECEIPT', $5, $6::date, $7::jsonb, NOW())"
)
content = content.replace(
    ', json.dumps(pay_data["appliedInvoices"], default=str), json.dumps(pay_data, default=str))',
    ', json.dumps(pay_data["appliedInvoices"], default=str))'
)

# Line 335
content = content.replace(
    'await tx.execute_raw("UPDATE docs_invoices SET status = \'PAID\', data = $1::jsonb WHERE id = $2", json.dumps(data_obj, default=str), invoice_id)',
    'await tx.execute_raw("UPDATE docs_invoices SET status = \'PAID\' WHERE id = $1", invoice_id)'
)

# Line 367
content = content.replace(
    'await tx.execute_raw("UPDATE docs_bills SET bill_number = $1, data = $2::jsonb WHERE id = $3", bill_number, json.dumps(b_data, default=str), bill_id)',
    'await tx.execute_raw("UPDATE docs_bills SET bill_number = $1 WHERE id = $2", bill_number, bill_id)'
)

# Line 556
content = content.replace(
    'await tx.execute_raw("UPDATE docs_payments SET status = \'POSTED\', data = $1::jsonb, updated_at = NOW() WHERE id = $2", json.dumps(p_data, default=str), payment_id)',
    'await tx.execute_raw("UPDATE docs_payments SET status = \'POSTED\', updated_at = NOW() WHERE id = $1", payment_id)'
)

# Line 631
content = content.replace(
    'UPDATE docs_payments SET status = \'POSTED\', data = $1::jsonb, updated_at = NOW() WHERE id = $2',
    'UPDATE docs_payments SET status = \'POSTED\', updated_at = NOW() WHERE id = $1'
)
content = content.replace(
    '        \"\"\", json.dumps(p_data, default=str), payment_id)',
    '        \"\"\", payment_id)'
)

# Line 841
content = content.replace(
    'UPDATE docs_products SET quantity_on_hand = $1, data = $2::jsonb, updated_at = NOW() WHERE id = $3',
    'UPDATE docs_products SET quantity_on_hand = $1, updated_at = NOW() WHERE id = $2'
)
content = content.replace(
    '\"\"\", new_stock, json.dumps(p_data, default=str), product_id)',
    '\"\"\", new_stock, product_id)'
)

# Line 901
content = content.replace(
    'await tx.execute_raw("UPDATE docs_credit_notes SET status = \'POSTED\', data = $1::jsonb, updated_at = NOW() WHERE id = $2", json.dumps(cn_data, default=str), cn_id)',
    'await tx.execute_raw("UPDATE docs_credit_notes SET status = \'POSTED\', updated_at = NOW() WHERE id = $1", cn_id)'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
