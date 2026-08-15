CREATE OR REPLACE FUNCTION initialize_product_inventory() RETURNS TRIGGER AS $$
    DECLARE
      v_cid TEXT;
      v_qty TEXT;
      v_cost NUMERIC;
    BEGIN
      -- Recursion guard
      IF pg_trigger_depth() > 5 THEN RETURN NEW; END IF;

      -- Prevent infinite trigger loop if initial stock levels and costs have not changed
      IF (TG_OP = 'UPDATE') THEN
        IF (NEW.data->'initialStockLevels') IS NOT DISTINCT FROM (OLD.data->'initialStockLevels')
            AND (NEW.data->>'initialCost') IS NOT DISTINCT FROM (OLD.data->>'initialCost')
            AND (NEW.data->>'createdAt') IS NOT DISTINCT FROM (OLD.data->>'createdAt') THEN
          RETURN NEW;
        END IF;
      END IF;

      IF (NEW.data->'initialStockLevels') IS NOT NULL THEN
        FOR v_cid, v_qty IN SELECT * FROM jsonb_each_text(NEW.data->'initialStockLevels') LOOP
           v_cost := COALESCE(NULLIF(NEW.data->>'initialCost', '')::NUMERIC, NULLIF(NEW.data->>'costPrice', '')::NUMERIC, 0);
           
           INSERT INTO docs_inventory_transactions (id, company_id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, date, cost_price)
           VALUES ('mov-init-' || NEW.id || '-' || v_cid, v_cid, NEW.id, 'wh-' || v_cid, 'IN', COALESCE(NULLIF(v_qty, '')::NUMERIC, 0), NEW.id, 'OPENING_STOCK', COALESCE(NULLIF(NEW.data->>'createdAt', '')::DATE, NOW()::DATE), v_cost)
           ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, updated_at = NOW();
        END LOOP;
      END IF;
      
      RETURN NEW;
    END;
$$ LANGUAGE plpgsql;
