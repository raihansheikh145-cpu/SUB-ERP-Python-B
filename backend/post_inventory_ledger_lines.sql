CREATE OR REPLACE FUNCTION public.post_inventory_ledger_lines()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
        DECLARE
            v_journal_id TEXT;
            v_inv_acc TEXT;
            v_cogs_acc TEXT;
            v_exp_acc TEXT;
            v_valuation NUMERIC;
            v_company_id TEXT;
            v_product_name TEXT;
            v_contact_id TEXT;
            v_ref_type TEXT;
            v_ref_id TEXT;
            v_tx_id TEXT;
            v_tx_type TEXT;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                v_company_id := OLD.company_id;
                v_ref_type := OLD.reference_type;
                v_ref_id := OLD.reference_id;
                v_tx_id := OLD.id;
                v_tx_type := OLD.transaction_type;
            ELSE
                v_company_id := NEW.company_id;
                v_ref_type := NEW.reference_type;
                v_ref_id := NEW.reference_id;
                v_tx_id := NEW.id;
                v_tx_type := NEW.transaction_type;
                v_valuation := ROUND(NEW.quantity * NEW.cost_price, 2);
                
                SELECT id INTO v_inv_acc FROM docs_accounts WHERE code = '100501' AND company_id = v_company_id LIMIT 1;
                IF v_inv_acc IS NULL THEN SELECT id INTO v_inv_acc FROM docs_accounts WHERE (name ILIKE '%inventory%' OR code ILIKE '1005%') AND company_id = v_company_id LIMIT 1; END IF;
                
                SELECT id INTO v_cogs_acc FROM docs_accounts WHERE code IN ('500101', '500100', '400501') AND company_id = v_company_id LIMIT 1;
                IF v_cogs_acc IS NULL THEN SELECT id INTO v_cogs_acc FROM docs_accounts WHERE (name ILIKE '%cost of goods%' OR name ILIKE '%cogs%' OR code ILIKE '5001%' OR code ILIKE '4005%') AND company_id = v_company_id LIMIT 1; END IF;
                
                SELECT id INTO v_exp_acc FROM docs_accounts WHERE code = '500501' AND company_id = v_company_id LIMIT 1;
                IF v_exp_acc IS NULL THEN SELECT id INTO v_exp_acc FROM docs_accounts WHERE (name ILIKE '%adjustment%' OR code ILIKE '5005%') AND company_id = v_company_id LIMIT 1; END IF;
                
                SELECT data->>'name' INTO v_product_name FROM docs_products WHERE id = NEW.product_id;
            END IF;
            
            IF v_ref_type = 'INVOICE' THEN
                SELECT COALESCE(journal_entry_id, 'JE-' || replace(replace(UPPER(v_ref_id), 'INV-', ''), 'INVOICE-', '')) INTO v_journal_id FROM docs_invoices WHERE id = v_ref_id OR upper(id) = upper(v_ref_id) limit 1; 
                IF v_journal_id IS NULL THEN v_journal_id := 'JE-' || replace(replace(UPPER(v_ref_id), 'INV-', ''), 'INVOICE-', ''); END IF;
                
                IF TG_OP = 'DELETE' THEN
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-cogs-' || v_tx_id;
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-inv-' || v_tx_id;
                    RETURN OLD;
                END IF;
                
                IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_tx_type = 'OUT' AND v_valuation > 0 THEN 
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-cogs-' || v_tx_id, v_journal_id, v_company_id, v_cogs_acc, v_valuation, 0, 'COGS: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, 0, v_valuation, 'Inv Red: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                END IF;
            ELSIF v_ref_type = 'CREDIT_NOTE' THEN
                SELECT COALESCE(data->>'journalEntryId', 'JE-' || replace(replace(UPPER(v_ref_id), 'CN-', ''), 'CREDIT-', '')) INTO v_journal_id FROM docs_credit_notes WHERE id = v_ref_id OR upper(id) = upper(v_ref_id) limit 1; 
                IF v_journal_id IS NULL THEN v_journal_id := 'JE-' || replace(replace(UPPER(v_ref_id), 'CN-', ''), 'CREDIT-', ''); END IF;
                
                IF TG_OP = 'DELETE' THEN
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-inv-' || v_tx_id;
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-cogs-' || v_tx_id;
                    RETURN OLD;
                END IF;
                
                IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_tx_type = 'IN' AND v_valuation > 0 THEN 
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, v_valuation, 0, 'Inv Add: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                     VALUES ('JL-' || v_journal_id || '-cogs-' || v_tx_id, v_journal_id, v_company_id, v_cogs_acc, 0, v_valuation, 'COGS Rev: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                END IF;
            ELSIF v_ref_type = 'ADJUSTMENT' THEN
                v_journal_id := 'JE-ADJ-' || replace(UPPER(v_ref_id), 'ADJ-', '');
                IF TG_OP = 'DELETE' THEN
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-inv-' || v_tx_id;
                    UPDATE docs_journal_lines SET debit = 0, credit = 0 WHERE id = 'JL-' || v_journal_id || '-exp-' || v_tx_id;
                    RETURN OLD;
                END IF;
                
                IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND v_valuation > 0 THEN 
                     SELECT data->>'contactId' INTO v_contact_id FROM docs_inventory_adjustments WHERE id = v_ref_id;
                     IF v_tx_type = 'IN' THEN 
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, v_valuation, 0, 'Adj Inv Add: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-exp-' || v_tx_id, v_journal_id, v_company_id, v_exp_acc, v_contact_id, 0, v_valuation, 'Adj Gain: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     ELSE 
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-exp-' || v_tx_id, v_journal_id, v_company_id, v_exp_acc, v_contact_id, v_valuation, 0, 'Adj Loss: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                         INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
                         VALUES ('JL-' || v_journal_id || '-inv-' || v_tx_id, v_journal_id, v_company_id, v_inv_acc, 0, v_valuation, 'Adj Inv Red: ' || COALESCE(v_product_name, 'Product')) ON CONFLICT (id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit;
                     END IF;
                END IF;
            END IF;
            IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
        END;
$function$
