import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('transactions').select('*');
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Transactions count:", data.length);
    console.log("Sample:", JSON.stringify(data[0], null, 2));
  }
}
test();
