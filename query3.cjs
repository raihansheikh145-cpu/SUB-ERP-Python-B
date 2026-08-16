const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    let inv = {
        id: '504b3400-b0c6-4e52-847b-439667ddd6fa', // The POSTED invoice
        status: 'POSTED',
        messages: [{ id: 'msg-2', body: 'New comment' }]
    };
    
    console.log("Calling process_invoice for POSTED invoice");
    const { data, error } = await supabase.rpc('process_invoice', { p_invoice: inv });
    console.log("Error:", error);
}
run();
