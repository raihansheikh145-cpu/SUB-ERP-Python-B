const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.from('docs_invoices').select('id, data').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Invoice data:", JSON.stringify(data[0].data, null, 2));
    }
}
run();
