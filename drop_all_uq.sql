DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname, conrelid::regclass AS tablename
        FROM pg_constraint
        WHERE contype = 'u' 
          AND conrelid::regclass::text LIKE 'docs_%'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || r.tablename || ' DROP CONSTRAINT ' || quote_ident(r.conname) || ' CASCADE;';
    END LOOP;
END $$;
