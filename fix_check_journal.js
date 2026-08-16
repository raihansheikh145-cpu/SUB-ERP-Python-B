import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres';
async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION check_journal_balance() RETURNS trigger AS $$
      DECLARE
          v_journal_id TEXT;
          v_debit NUMERIC;
          v_credit NUMERIC;
      BEGIN
          IF current_setting('core.bypass_audit', true) = 'true' THEN
              RETURN COALESCE(NEW, OLD);
          END IF;
          IF TG_TABLE_NAME = 'docs_journal_lines' THEN
              v_journal_id := COALESCE(NEW.journal_id, OLD.journal_id);
          ELSIF TG_TABLE_NAME = 'docs_journals' THEN
              v_journal_id := COALESCE(NEW.id, OLD.id);
          END IF;
          IF v_journal_id IS NOT NULL THEN
              SELECT SUM(debit), SUM(credit) INTO v_debit, v_credit FROM docs_journal_lines WHERE journal_id = v_journal_id;
              
              IF COALESCE(v_debit, 0) != COALESCE(v_credit, 0) THEN
                  RAISE EXCEPTION 'Strict Integrity: Journal Entry % is unbalanced. Debits: %, Credits: %', v_journal_id, v_debit, v_credit;
              END IF;
          END IF;
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Fixed check_journal_balance');
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
main();
