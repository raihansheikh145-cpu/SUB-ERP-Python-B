const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    let { data } = await supabase.from('docs_invoices').select('id, data, messages').order('updated_at', { ascending: false }).limit(3);
    console.log(JSON.stringify(data, null, 2));
}
run();
