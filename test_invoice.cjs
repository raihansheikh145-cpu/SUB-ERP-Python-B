const { createClient } = require('@supabase/supabase-js');
const url = 'https://buspgzsamhfmjrmmwpmo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3BnenNhbWhmbWpybW13cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMDgsImV4cCI6MjA5MjkxNDEwOH0.8Pj-NoDqlenxJr2azDs5L-gCfPJ-Bvcdzalq5UqKcRM';
const supabase = createClient(url, key);

async function run() {
    let inv = {
        id: 'test-inv-1234',
        companyId: 'comp-1',
        status: 'DRAFT',
        type: 'STANDARD',
        items: [],
        messages: [{ id: 'msg-1', body: 'Draft created' }]
    };
    
    console.log("Calling process_invoice");
    await supabase.rpc('process_invoice', { p_invoice: inv });
    
    let { data: d1 } = await supabase.from('docs_invoices').select('data').eq('id', 'test-inv-1234');
    console.log("After process:", JSON.stringify(d1[0].data.messages));
    
    console.log("Calling post_invoice");
    await supabase.rpc('post_invoice', { p_invoice_id: 'test-inv-1234', p_company_id: 'comp-1' });
    
    let { data: d2 } = await supabase.from('docs_invoices').select('data').eq('id', 'test-inv-1234');
    console.log("After post:", JSON.stringify(d2[0].data.messages));
}
run();
