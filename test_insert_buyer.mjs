import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const newBuyer = {
    id: `buyer-${Date.now()}`,
    email: 'guest2@lenscanvas.io',
    role: 'buyer',
    sellerStatus: 'none',
    fullName: 'Guest Buyer'
  };
  const { data, error } = await supabase.from('users').insert([newBuyer]);
  if (error) {
    console.error("Error inserting buyer:", error);
  } else {
    console.log("Success inserting buyer:", data);
  }
}
test();
