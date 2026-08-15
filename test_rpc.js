require('dotenv').config({ override: true });
const { createClient } = require('@supabase/supabase-js');
async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const res = await supabase.rpc('post_loan_payment_rpc', { p_loan_id: '9de26e5e-5ab7-4d05-ab9c-de0a2a5bb03f', p_period: 1, p_date: '2026-07-14', p_interest_to_pay: 0 });
  console.log(res);
}
run();
