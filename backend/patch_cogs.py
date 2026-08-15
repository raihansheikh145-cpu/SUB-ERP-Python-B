import re

with open("post_invoice_original.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Add the account lookups right after fetching the AR and Revenue accounts
# In the original, they fetch AR and Rev accounts around here:
# SELECT id INTO v_ar_acc FROM docs_accounts WHERE code = '100201' ...
# Let's just add it before the FOR loop.
lookups = """
                SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code = '500101' AND company_id = v_effective_company_id LIMIT 1;
                IF v_cogs_acc IS NULL THEN
                    SELECT id INTO v_cogs_acc FROM docs_accounts WHERE name ILIKE '%cost of goods sold%' AND company_id = v_effective_company_id LIMIT 1;
                END IF;

                SELECT id INTO v_inv_acc FROM docs_accounts WHERE code = '100501' AND company_id = v_effective_company_id LIMIT 1;
                IF v_inv_acc IS NULL THEN
                    SELECT id INTO v_inv_acc FROM docs_accounts WHERE name ILIKE '%inventory asset%' AND company_id = v_effective_company_id LIMIT 1;
                END IF;
"""

sql = sql.replace("v_items := COALESCE(v_invoice.data->'items', '[]'::jsonb);", lookups + "\n                v_items := COALESCE(v_invoice.data->'items', '[]'::jsonb);")

# Inject the journal lines
injection = """
                                SELECT * INTO v_product_record FROM docs_products WHERE id = (v_item->>'productId');

                                v_cogs_amount := ROUND(v_wac_cost * COALESCE((v_item->>'quantity')::numeric, 1), 2);
                                IF v_cogs_amount > 0 THEN
                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ('JL-' || v_journal_id || '-cogs-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_cogs_acc, 'MISSING-COGS'), v_cogs_amount, 0, 'COGS: ' || (v_item->>'description'));

                                    INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                                    VALUES ('JL-' || v_journal_id || '-inv-' || v_idx, v_journal_id, v_effective_company_id, COALESCE(v_inv_acc, 'MISSING-INV'), 0, v_cogs_amount, 'Inventory: ' || (v_item->>'description'));
                                END IF;
"""

sql = sql.replace("SELECT * INTO v_product_record FROM docs_products WHERE id = (v_item->>'productId');", injection)

with open("post_invoice_patched.sql", "w", encoding="utf-8") as f:
    f.write("CREATE OR REPLACE " + sql.split("CREATE OR REPLACE", 1)[-1] if "CREATE OR REPLACE" in sql else "CREATE OR REPLACE FUNCTION " + sql.split("FUNCTION ", 1)[-1])
