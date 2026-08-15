CREATE OR REPLACE FUNCTION update_average_cost() RETURNS TRIGGER AS $$
    DECLARE
       v_pid TEXT;
       v_cid TEXT;
       v_wid TEXT;
       v_cost_id TEXT;
       v_total_qty NUMERIC := 0;
       v_total_val NUMERIC := 0;
       v_avg_cost NUMERIC := 0;
       v_base_cost NUMERIC := 0;
       v_current_cost NUMERIC;
       r RECORD;
    BEGIN
       IF pg_trigger_depth() > 5 THEN RETURN NEW; END IF;

       v_pid := COALESCE(NEW.product_id, OLD.product_id);
       v_cid := COALESCE(NEW.company_id, OLD.company_id);
       v_wid := COALESCE(NEW.warehouse_id, OLD.warehouse_id);
       v_cost_id := v_cid || ':' || v_pid || ':' || v_wid;

       SELECT COALESCE(NULLIF(data->>'costPrice', '')::NUMERIC, 0) INTO v_base_cost FROM docs_products WHERE id = v_pid;
       v_avg_cost := COALESCE(v_base_cost, 0);

       FOR r IN
          SELECT transaction_type, quantity, cost_price, reference_type
         FROM docs_inventory_transactions 
         WHERE product_id = v_pid AND warehouse_id = v_wid AND company_id = v_cid
         ORDER BY date ASC, created_at ASC 
       LOOP
          IF r.transaction_type = 'IN' THEN
             IF r.reference_type IN ('BILL', 'ADJUSTMENT', 'OPENING_STOCK') THEN
                IF v_total_qty <= 0 THEN
                    v_avg_cost := COALESCE(r.cost_price, v_avg_cost);
                    v_total_qty := v_total_qty + r.quantity;
                    v_total_val := v_total_qty * v_avg_cost;
                ELSE
                    v_total_val := v_total_val + (r.quantity * r.cost_price);
                    v_total_qty := v_total_qty + r.quantity;
                    IF v_total_qty > 0 THEN
                        v_avg_cost := v_total_val / v_total_qty; 
                    END IF;
                END IF;
             ELSE
                v_total_qty := v_total_qty + r.quantity;
                v_total_val := v_total_qty * v_avg_cost;
             END IF;
          ELSE
             IF r.reference_type = 'PURCHASE_RETURN' THEN
                IF v_total_qty <= 0 THEN
                    v_total_qty := v_total_qty - r.quantity;
                    v_total_val := v_total_qty * v_avg_cost;
                ELSE
                    v_total_val := v_total_val - (r.quantity * r.cost_price);
                    v_total_qty := v_total_qty - r.quantity;
                    IF v_total_qty > 0 THEN
                        v_avg_cost := v_total_val / v_total_qty; 
                    END IF;
                END IF;
             ELSE
                v_total_qty := v_total_qty - r.quantity;
                v_total_val := v_total_qty * v_avg_cost;
             END IF;
          END IF;
       END LOOP;

       v_total_qty := COALESCE(v_total_qty, 0);
       v_avg_cost := COALESCE(v_avg_cost, v_base_cost);
       
       SELECT NULLIF(data->>'costPrice', '')::NUMERIC INTO v_current_cost FROM docs_products WHERE id = v_pid;

       IF v_total_qty <= 0 THEN
          v_total_val := 0;
       ELSE
          v_total_val := v_total_qty * v_avg_cost;
       END IF;

       INSERT INTO docs_product_costs (id, company_id, product_id, warehouse_id, total_qty, total_value, avg_cost, updated_at)
       VALUES (v_cost_id, v_cid, v_pid, v_wid, v_total_qty, v_total_val, v_avg_cost, NOW())
       ON CONFLICT (id) DO UPDATE SET 
         total_qty = EXCLUDED.total_qty,
         total_value = EXCLUDED.total_value,
         avg_cost = EXCLUDED.avg_cost,
         updated_at = NOW();

       IF v_current_cost IS DISTINCT FROM v_avg_cost THEN
           UPDATE docs_products p
           SET cost_price = v_avg_cost,
               data = jsonb_set(COALESCE(data, '{}'::jsonb), '{costPrice}', to_jsonb(v_avg_cost)),
               updated_at = NOW()
           WHERE id = v_pid;
       END IF;

       RETURN COALESCE(NEW, OLD);
    END;
$$ LANGUAGE plpgsql;
