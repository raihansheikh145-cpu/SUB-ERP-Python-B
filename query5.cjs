const { createClient } = require('@supabase/supabase-js');
const url = 'https://buspgzsamhfmjrmmwpmo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3BnenNhbWhmbWpybW13cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMDgsImV4cCI6MjA5MjkxNDEwOH0.8Pj-NoDqlenxJr2azDs5L-gCfPJ-Bvcdzalq5UqKcRM';
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
