import { createClient } from '@supabase/supabase-js';

const url = "https://<SUPABASE_PROJECT_REF>.supabase.co";
const key = "<SUPABASE_ANON_KEY>";
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('process_invoice', {
    p_invoice: { id: "test-inv-99", companyId: "comp-1", date: "2026-07-13", customerId: "cust-1", items: [{productId: "prod-1", quantity: 1, unitPrice: 100}] }
  });
  console.log('rpc process_invoice output:', data);
  console.log('rpc error:', error);
}
run();
