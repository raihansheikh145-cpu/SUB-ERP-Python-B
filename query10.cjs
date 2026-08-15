const { createClient } = require('@supabase/supabase-js');
const url = 'https://buspgzsamhfmjrmmwpmo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3BnenNhbWhmbWpybW13cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMDgsImV4cCI6MjA5MjkxNDEwOH0.8Pj-NoDqlenxJr2azDs5L-gCfPJ-Bvcdzalq5UqKcRM';
const supabase = createClient(url, key);

async function run() {
    let { data: invs } = await supabase.from('docs_invoices').select('id, data, messages, status').eq('status', 'DRAFT').limit(1);
    if (!invs || invs.length === 0) { console.log('no draft invoices'); return; }
    let inv = invs[0];
    
    let frontendInv = { ...inv.data, id: inv.id };
    
    // mimic store.updateInvoice
    let messages = [...(frontendInv.messages || []), { id: 'test_msg_from_query10', type: 'notification', body: 'Invoice Confirmed and Posted.', date: new Date().toISOString() }];
    frontendInv.messages = messages;
    frontendInv.status = 'DRAFT'; // updatedInvoice status
    
    console.log("Calling process_invoice");
    const { error: e2 } = await supabase.rpc('process_invoice', { p_invoice: frontendInv });
    console.log("RPC Error:", e2);
    
    let { data: newInv } = await supabase.from('docs_invoices').select('id, data, messages, status').eq('id', inv.id).single();
    console.log("New Invoice Data Messages:", JSON.stringify(newInv.data.messages, null, 2));
    console.log("New Invoice Column Messages:", JSON.stringify(newInv.messages, null, 2));
}
run();
