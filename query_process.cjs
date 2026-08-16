const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    const { data: d2, error: e2 } = await supabase.rpc('execute_sql', { sql_statement: "SELECT pg_get_functiondef('process_invoice'::regproc);" });
    console.log("e2", e2, "d2", d2);
}
run();
