DO $$
DECLARE
    v_inv RECORD;
    v_journal_id TEXT;
    v_missing_cogs BOOLEAN;
    v_has_inventory BOOLEAN;
    v_count INT := 0;
BEGIN
    FOR v_inv IN SELECT id, status, journal_entry_id FROM docs_invoices WHERE status IN ('POSTED', 'PAID', 'PARTIAL') AND journal_entry_id IS NOT NULL
    LOOP
        v_missing_cogs := FALSE;
        IF NOT EXISTS (SELECT 1 FROM docs_journal_lines WHERE journal_id = v_inv.journal_entry_id AND id LIKE '%-cogs-%') THEN
            v_missing_cogs := TRUE;
        END IF;

        IF v_missing_cogs THEN
            v_has_inventory := FALSE;
            IF EXISTS (
                SELECT 1 FROM docs_invoice_lines l
                LEFT JOIN docs_products p ON p.id = l.product_id
                WHERE l.invoice_id = v_inv.id AND l.type = 'PRODUCT' 
                AND (p.track_inventory = true OR p.data->>'trackInventory' = 'true')
                AND l.quantity > 0
            ) THEN
                v_has_inventory := TRUE;
            END IF;

            IF v_has_inventory THEN
                -- Reset and recalculate
                PERFORM set_config('core.bypass_audit', 'true', true);
                UPDATE docs_journals SET status = 'DRAFT' WHERE id = v_inv.journal_entry_id;
                PERFORM post_invoice(v_inv.id);
                UPDATE docs_invoices SET status = v_inv.status WHERE id = v_inv.id;
                v_count := v_count + 1;
            END IF;
        END IF;
    END LOOP;
    RAISE NOTICE 'Fixed % invoices.', v_count;
END $$;
