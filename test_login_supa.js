import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkdgsnlrhvmtjddwvuzd.supabase.co';
const supabaseKey = '<SUPABASE_ANON_KEY>';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'raihansheikh145@gmail.com',
    password: '87654321'
  });
  
  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Login successful! User ID:', data.user.id);
  }
}

testLogin();
