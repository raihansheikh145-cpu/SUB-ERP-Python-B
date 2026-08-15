import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkdgsnlrhvmtjddwvuzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZGdzbmxyaHZtdGpkZHd2dXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDA3MTQsImV4cCI6MjEwMDAxNjcxNH0.DRKCYrlwLoJjyvTMMsp7EMiWHHS2wZGHGcfH2Fg7kR8';

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
