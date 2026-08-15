CREATE OR REPLACE FUNCTION trg_generate_product_opening_balance() RETURNS TRIGGER AS $$
    DECLARE
      v_qty NUMERIC;
      v_cost NUMERIC;
      v_total_value NUMERIC;
      v_journal_id TEXT;
      v_inv_account_id TEXT;
      v_eq_account_id TEXT;
    BEGIN
      v_qty := COALESCE(NULLIF(NEW.data->>'quantityOnHand', '')::NUMERIC, 0);
      v_cost := COALESCE(NEW.cost_price, NULLIF(NEW.data->>'costPrice', '')::NUMERIC, 0);
      v_total_value := v_qty * v_cost;

      IF v_total_value > 0 THEN
        -- Check if an opening stock journal entry already exists for this SKU to prevent duplicates
        IF EXISTS (
          SELECT 1 FROM docs_journals 
          WHERE company_id = NEW.company_id 
            AND (reference_number = 'OB-' || NEW.sku OR reference_number LIKE 'INIT-%' || NEW.sku || '%')
        ) THEN
          RETURN NEW;
        END IF;

        v_journal_id := 'JEN-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6);
        
        -- Resolve accounts dynamically
        SELECT id INTO v_inv_account_id 
        FROM docs_accounts 
        WHERE company_id = NEW.company_id 
          AND (code IN ('100501', '100502', '100500') OR (data->>'subType' = 'INVENTORY'))
        LIMIT 1;
        IF v_inv_account_id IS NULL THEN
          v_inv_account_id := NEW.company_id || '-100501';
        END IF;

        SELECT id INTO v_eq_account_id 
        FROM docs_accounts 
        WHERE company_id = NEW.company_id 
          AND (code IN ('300100', '300200', '300000', '300001') OR (data->>'subType' = 'EQUITY'))
        LIMIT 1;
        IF v_eq_account_id IS NULL THEN
          v_eq_account_id := NEW.company_id || '-300100';
        END IF;

        INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, data)
        VALUES (
          v_journal_id, 
          NEW.company_id, 
          CURRENT_DATE, 
          CURRENT_DATE,
          'OPENING_BALANCE', 
          'DRAFT', -- DRAFT first
          'OB-' || NEW.sku, 
          jsonb_build_object(
            'id', v_journal_id,
            'companyId', NEW.company_id,
            'date', CURRENT_DATE,
            'journal_date', CURRENT_DATE,
            'journalType', 'OPENING_BALANCE',
            'status', 'DRAFT',
            'reference', 'OB-' || NEW.sku,
            'description', 'Opening Stock Entry for ' || NEW.name
          )
        );

        -- Debit Inventory Asset, Credit Equity
        INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
        VALUES 
          ('JEL-' || extract(epoch from now())::text || '-1', v_journal_id, NEW.company_id, v_inv_account_id, NULL, v_total_value, 0, 'Opening Stock Asset'),
          ('JEL-' || extract(epoch from now())::text || '-2', v_journal_id, NEW.company_id, v_eq_account_id, NULL, 0, v_total_value, 'Opening Stock Equity');
          
        -- Now set it to POSTED
        UPDATE docs_journals SET status = 'POSTED', data = jsonb_set(data, '{status}', '"POSTED"') WHERE id = v_journal_id;
      END IF;
      
      RETURN NEW;
    END;
$$ LANGUAGE plpgsql;
