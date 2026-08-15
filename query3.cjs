const { createClient } = require('@supabase/supabase-js');
const url = 'https://buspgzsamhfmjrmmwpmo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3BnenNhbWhmbWpybW13cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMDgsImV4cCI6MjA5MjkxNDEwOH0.8Pj-NoDqlenxJr2azDs5L-gCfPJ-Bvcdzalq5UqKcRM';
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
