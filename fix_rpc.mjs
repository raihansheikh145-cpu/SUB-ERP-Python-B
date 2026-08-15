import fs from 'fs';

let content = fs.readFileSync('workspace/apply_rpc.mjs', 'utf8');

const arFallback = `
                SELECT id INTO v_ar_acc FROM docs_accounts WHERE (code IN ('1012','100200','100201','AR') OR data->>'code' IN ('1012','100200','100201','AR')) AND company_id = v_effective_company_id LIMIT 1;
                IF v_ar_acc IS NULL THEN SELECT id INTO v_ar_acc FROM docs_accounts WHERE (type = 'ASSET' OR data->>'type' = 'ASSET') AND (name ILIKE '%receivable%' OR data->>'name' ILIKE '%receivable%') AND company_id = v_effective_company_id LIMIT 1; END IF;
                IF v_ar_acc IS NULL THEN 
                    v_ar_acc := 'acc-ar-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_ar_acc, v_effective_company_id, 'AR', 'Accounts Receivable', 'ASSET', '{"code":"AR","name":"Accounts Receivable","type":"ASSET"}') ON CONFLICT DO NOTHING;
                END IF;

                SELECT id INTO v_rev_acc FROM docs_accounts WHERE (code IN ('4011', '4000', '400100', 'REVENUE', 'SALES') OR data->>'code' IN ('4011', '4000', '400100', 'REVENUE', 'SALES')) AND company_id = v_effective_company_id LIMIT 1;
                IF v_rev_acc IS NULL THEN SELECT id INTO v_rev_acc FROM docs_accounts WHERE (type = 'REVENUE' OR data->>'type' = 'REVENUE') AND company_id = v_effective_company_id LIMIT 1; END IF;
                IF v_rev_acc IS NULL THEN
                    v_rev_acc := 'acc-rev-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_rev_acc, v_effective_company_id, 'REV', 'General Revenue', 'REVENUE', '{"code":"REV","name":"General Revenue","type":"REVENUE"}') ON CONFLICT DO NOTHING;
                END IF;

                SELECT id INTO v_tax_acc FROM docs_accounts WHERE (code IN ('2011', '200100', 'TAX_PAYABLE') OR data->>'code' IN ('2011', '200100', 'TAX_PAYABLE')) AND company_id = v_effective_company_id LIMIT 1;
                IF v_tax_acc IS NULL THEN SELECT id INTO v_tax_acc FROM docs_accounts WHERE (name ILIKE '%tax%payable%' OR data->>'name' ILIKE '%tax%payable%') AND company_id = v_effective_company_id LIMIT 1; END IF;
                IF v_tax_acc IS NULL THEN SELECT id INTO v_tax_acc FROM docs_accounts WHERE (type = 'LIABILITY' OR data->>'type' = 'LIABILITY') AND company_id = v_effective_company_id LIMIT 1; END IF;
                IF v_tax_acc IS NULL THEN
                    v_tax_acc := 'acc-tax-' || v_effective_company_id;
                    INSERT INTO docs_accounts (id, company_id, code, name, type, data) VALUES (v_tax_acc, v_effective_company_id, 'TAX', 'Tax Payable', 'LIABILITY', '{"code":"TAX","name":"Tax Payable","type":"LIABILITY"}') ON CONFLICT DO NOTHING;
                END IF;

                -- Create AR debit line
                INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                VALUES ('JL-' || v_journal_id || '-ar', v_journal_id, v_effective_company_id, 
                        v_ar_acc,
                        v_invoice.customer_id, COALESCE(v_invoice.total, 0), 0, 'Accounts Receivable: ' || COALESCE(v_invoice.invoice_number, v_invoice.id));
`;

content = content.replace(/SELECT id INTO v_rev_acc FROM docs_accounts[\s\S]*COALESCE\(v_invoice.invoice_number, v_invoice.id\)\);/, arFallback);

// Need to also declare v_ar_acc
content = content.replace('v_rev_acc TEXT;', 'v_rev_acc TEXT;\n                v_ar_acc TEXT;');

fs.writeFileSync('workspace/apply_rpc_fixed2.mjs', content);
