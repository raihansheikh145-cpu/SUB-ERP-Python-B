CREATE OR REPLACE FUNCTION create_default_warehouse()
RETURNS trigger AS $$
BEGIN
    INSERT INTO docs_warehouses (id, data, updated_at, company_id, code, name, is_default)
    VALUES (
        'wh-' || NEW.id,
        jsonb_build_object(
        'id', 'wh-' || NEW.id,
        'companyId', NEW.id,
        'name', 'Default Warehouse',
        'code', 'WH-' || get_company_short_code(NEW.id) || '-01',
        'isDefault', true
        ),
        NOW(),
        NEW.id,
        'WH-' || get_company_short_code(NEW.id) || '-01',
        'Default Warehouse',
        true
    ) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
