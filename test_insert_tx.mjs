import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const tx = {
    id: `tx-${Date.now()}`,
    buyerId: 'user-buyer', 
    sellerId: 'some-seller-id',
    productId: 'some-prod-id',
    amount: 150,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  const { data, error } = await supabase.from('transactions').insert([tx]);
  if (error) {
    console.error("Error inserting transaction:", error);
  } else {
    console.log("Success inserting transaction:", data);
  }
}
test();
