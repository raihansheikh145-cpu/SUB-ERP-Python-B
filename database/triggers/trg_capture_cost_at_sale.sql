CREATE OR REPLACE FUNCTION capture_cost_at_sale() RETURNS TRIGGER AS $$
    DECLARE
        v_company_id TEXT;
    BEGIN
        IF NEW.product_id IS NOT NULL THEN
            -- Safely resolve company_id from parent invoice if missing/empty in line
            v_company_id := NEW.company_id;
            IF v_company_id IS NULL OR v_company_id = '' THEN
                SELECT company_id INTO v_company_id FROM docs_invoices WHERE id = NEW.invoice_id;
                NEW.company_id := v_company_id;
            END IF;

            -- Only set if it hasn't been explicitly locked / provided
            IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                -- Try company warehouse WAC
                SELECT avg_cost INTO NEW.cost_price_at_sale 
                FROM docs_product_costs 
                WHERE product_id = NEW.product_id 
                  AND company_id = v_company_id 
                  AND warehouse_id = 'wh-' || v_company_id
                LIMIT 1;

                -- Fallback to main warehouse WAC
                IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                    SELECT avg_cost INTO NEW.cost_price_at_sale 
                    FROM docs_product_costs 
                    WHERE product_id = NEW.product_id 
                      AND company_id = v_company_id 
                      AND warehouse_id = 'main'
                    LIMIT 1;
                END IF;

                -- Fallback to product defined cost_price
                IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                    SELECT COALESCE(cost_price, last_purchase_price, initial_cost, NULLIF(data->>'costPrice', '')::numeric, 0)
                    INTO NEW.cost_price_at_sale
                    FROM docs_products
                    WHERE id = NEW.product_id;
                END IF;

                -- Ultimate Fallback Safeguard: If cost is still 0/null, fallback to 70% of the sales price to prevent a 100% false profit.
                IF NEW.cost_price_at_sale IS NULL OR NEW.cost_price_at_sale = 0 THEN
                    NEW.cost_price_at_sale := COALESCE(NEW.unit_price, 0) * 0.70;
                END IF;
                
                NEW.cost_price_at_sale := COALESCE(NEW.cost_price_at_sale, 0);
            END IF;
        END IF;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;
