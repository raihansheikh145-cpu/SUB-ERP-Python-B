UPDATE docs_journals SET created_by_id = 'user-1785220532222' WHERE created_by_id NOT IN (SELECT id FROM docs_users) OR created_by_id IS NULL;
UPDATE docs_bills SET created_by_id = 'user-1785220532222' WHERE created_by_id NOT IN (SELECT id FROM docs_users) OR created_by_id IS NULL;
UPDATE docs_invoices SET created_by_id = 'user-1785220532222' WHERE created_by_id NOT IN (SELECT id FROM docs_users) OR created_by_id IS NULL;
UPDATE docs_payments SET created_by_id = 'user-1785220532222' WHERE created_by_id NOT IN (SELECT id FROM docs_users) OR created_by_id IS NULL;
UPDATE docs_credit_notes SET created_by_id = 'user-1785220532222' WHERE created_by_id NOT IN (SELECT id FROM docs_users) OR created_by_id IS NULL;
