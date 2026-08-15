const { createClient } = require('@supabase/supabase-js');
const url = 'https://buspgzsamhfmjrmmwpmo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3BnenNhbWhmbWpybW13cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMDgsImV4cCI6MjA5MjkxNDEwOH0.8Pj-NoDqlenxJr2azDs5L-gCfPJ-Bvcdzalq5UqKcRM';
const supabase = createClient(url, key);

async function run() {
    const { data } = await supabase.from('docs_invoices').select('id, messages, data').eq('status', 'POSTED').limit(1);
    console.log("TOP LEVEL MESSAGES:", JSON.stringify(data[0].messages));
    console.log("DATA MESSAGES:", JSON.stringify(data[0].data.messages));
}
run();
