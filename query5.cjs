const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    let inv = {
        id: 'test-inv-456',
        companyId: 'comp-1',
        status: 'DRAFT',
        type: 'STANDARD',
        items: [],
        messages: [{ id: 'msg-1', body: 'Draft created' }]
    };
    
    await supabase.rpc('process_invoice', { p_invoice: inv });
    
    // Now update it
    inv.messages.push({ id: 'msg-2', body: 'New comment' });
    await supabase.rpc('process_invoice', { p_invoice: inv });
    
    let { data } = await supabase.from('docs_invoices').select('id, messages, data').eq('id', 'test-inv-456');
    console.log("TOP LEVEL:", JSON.stringify(data[0].messages));
    console.log("DATA MESSAGES:", JSON.stringify(data[0].data.messages));
}
run();
