const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    let { data } = await supabase.from('docs_invoices').select('id, data, messages').order('updated_at', { ascending: false }).limit(1);
    console.log("DB Messages:", JSON.stringify(data[0].messages));
    console.log("Data Messages:", JSON.stringify(data[0].data.messages));
}
run();
