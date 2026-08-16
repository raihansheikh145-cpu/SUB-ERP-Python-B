const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    // 1. Fetch a draft invoice
    let { data: invs } = await supabase.from('docs_invoices').select('*').eq('status', 'DRAFT').limit(1);
    if (!invs || invs.length === 0) { console.log('no draft invoices'); return; }
    let inv = invs[0];
    let frontendInv = { ...inv.data, id: inv.id, companyId: inv.company_id, customerId: inv.customer_id, messages: inv.messages || inv.data.messages || [] };
    
    // 2. mimic InvoiceManager Confirm logic
    const confirmedMessages = [...(frontendInv.messages || []), {
         id: 'test_confirm_ui',
         authorId: 'user-1',
         body: 'Invoice Confirmed and Posted.',
         date: new Date().toISOString(),
         type: 'notification'
    }];
    
    // 3. updateInvoice
    frontendInv.messages = confirmedMessages;
    await supabase.rpc('process_invoice', { p_invoice: frontendInv });
    
    // 4. postInvoice
    await supabase.rpc('post_invoice', { p_invoice_id: frontendInv.id, p_company_id: frontendInv.companyId });
    
    // 5. fetch like getPaginatedDocs
    let { data: finalInv } = await supabase.from('docs_invoices').select('*').eq('id', frontendInv.id).single();
    
    console.log("Final DB record messages column length:", finalInv.messages ? finalInv.messages.length : 0);
    console.log("Final DB record data.messages length:", finalInv.data.messages ? finalInv.data.messages.length : 0);
    
    // mimic mapDatabaseRowToFrontend
    let rest = { ...finalInv };
    if ((!rest.messages || rest.messages.length === 0) && rest.data && rest.data.messages) {
      rest.messages = rest.data.messages;
    }
    let mapped = { ...(rest.data || {}), ...rest };
    console.log("Mapped messages length:", mapped.messages ? mapped.messages.length : 0);
}
run();
