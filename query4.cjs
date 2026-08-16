const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    const { data } = await supabase.from('docs_invoices').select('id, messages, data').eq('status', 'POSTED').limit(1);
    console.log("TOP LEVEL MESSAGES:", JSON.stringify(data[0].messages));
    console.log("DATA MESSAGES:", JSON.stringify(data[0].data.messages));
}
run();
