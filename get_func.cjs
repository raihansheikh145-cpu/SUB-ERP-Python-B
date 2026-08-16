const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.rpc('get_balance_sheet_structured', { p_company_ids: [], p_as_of_date: '2026-07-18' });
    if (error) {
        console.error("Error calling rpc:", error);
    } else {
        console.log("Success");
    }
}
run();
