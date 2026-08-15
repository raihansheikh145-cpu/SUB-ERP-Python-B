const { createClient } = require('@supabase/supabase-js');
const url = 'https://buspgzsamhfmjrmmwpmo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1c3BnenNhbWhmbWpybW13cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMDgsImV4cCI6MjA5MjkxNDEwOH0.8Pj-NoDqlenxJr2azDs5L-gCfPJ-Bvcdzalq5UqKcRM';
const supabase = createClient(url, key);

async function run() {
    let { data } = await supabase.from('docs_invoices').select('id, data, messages').order('updated_at', { ascending: false }).limit(3);
    console.log(JSON.stringify(data, null, 2));
}
run();
