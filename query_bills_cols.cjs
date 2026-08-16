const { createClient } = require('@supabase/supabase-js');
const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.from('docs_bills').select('*').limit(1);
    console.log(Object.keys(data[0]));
}
run();
