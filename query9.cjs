const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    let { data } = await supabase.from('docs_invoices').select('id, data, messages').limit(1);
    console.log("DB messages column:", data[0].messages);
    console.log("JSON messages:", data[0].data.messages);
}
run();
