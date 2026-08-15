import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: bills, error: billsErr } = await supabase.from('docs_bills').select('id');
  console.log('Bills (anon):', bills?.length, billsErr);
  
  const { data: comps, error: compsErr } = await supabase.from('docs_companies').select('id');
  console.log('Companies (anon):', comps?.length, compsErr);
}

test();
