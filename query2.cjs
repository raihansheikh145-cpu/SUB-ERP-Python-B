const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.rpc('get_function_def', { func_name: 'post_invoice' });
    if (error) {
        console.error("Error:", error);
        
        // Let's try pg_get_functiondef via a SQL query wrapper if possible
        const { data: d2, error: e2 } = await supabase.rpc('execute_sql', { sql_statement: "SELECT pg_get_functiondef('post_invoice'::regproc);" });
        console.log("e2", e2, "d2", d2);
    } else {
        console.log("Function definition:", data);
    }
}
run();
