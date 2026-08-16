import { createClient } from '@supabase/supabase-js';

const url = 'https://<SUPABASE_PROJECT_REF>.supabase.co';
const key = '<SUPABASE_ANON_KEY>';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('docs_bills')
    .select('*')
    .or("bill_number.eq.BIL-SUL-000336,data->>number.eq.BIL-SUL-000336")
    .limit(1);
    
  console.log("Bill:", data, error);
  if (data && data.length > 0) {
     const { data: lines } = await supabase.from('docs_bill_lines').select('*').eq('bill_id', data[0].id);
     console.log("Lines:", lines);
     
     const { data: trans } = await supabase.from('docs_inventory_transactions').select('*').eq('reference_id', data[0].id);
     console.log("Transactions:", trans);
  }
}
run();
