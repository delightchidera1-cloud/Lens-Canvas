import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('users').update({ balance: 0 }).eq('id', 'non-existent-id');
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success, column exists or update worked");
  }
}
test();
