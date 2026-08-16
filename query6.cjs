const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    let { data } = await supabase.from('docs_invoices').select('*').eq('status', 'POSTED').limit(1);
    let inv = data[0];
    let frontendInv = {
        ...inv.data,
        ...inv,
        companyId: inv.company_id,
        customerId: inv.customer_id
    };
    
    // Add a message
    if (!frontendInv.messages) frontendInv.messages = [];
    frontendInv.messages.push({ id: 'test', body: 'This is a test comment on POSTED' });
    
    console.log("Calling process_invoice");
    const { error: e2 } = await supabase.rpc('process_invoice', { p_invoice: frontendInv });
    console.log("Error:", e2);
}
run();
