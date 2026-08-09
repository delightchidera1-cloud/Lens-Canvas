import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log("Backfilling missing transactions...");
  
  // Find all products with salesCount > 0
  const { data: products, error: prodError } = await supabase.from('products').select('*').gt('salesCount', 0);
  if (prodError) {
    console.error("Error fetching products:", prodError);
    return;
  }
  
  console.log(`Found ${products.length} products with sales.`);
  
  for (const prod of products) {
    // Check if a transaction exists for this product
    const { data: txs, error: txError } = await supabase.from('transactions').select('id').eq('productId', prod.id);
    if (txError) {
      console.error(`Error fetching tx for product ${prod.id}:`, txError);
      continue;
    }
    
    const missingTxCount = prod.salesCount - txs.length;
    if (missingTxCount > 0) {
      console.log(`Product ${prod.id} (${prod.title}) is missing ${missingTxCount} transactions! Backfilling...`);
      
      // Ensure there's a guest buyer
      const defaultBuyerId = `buyer-guest-fallback`;
      await supabase.from('users').upsert([{
        id: defaultBuyerId,
        email: 'system-guest-backfill@lenscanvas.io',
        role: 'buyer',
        sellerStatus: 'none',
        fullName: 'System Guest Backfill'
      }], { onConflict: 'id' });
      
      const newTxs = [];
      for (let i = 0; i < missingTxCount; i++) {
        newTxs.push({
          id: `tx-backfill-${Date.now()}-${Math.random()}`,
          buyerId: defaultBuyerId,
          sellerId: prod.sellerId,
          productId: prod.id,
          amount: prod.price,
          status: 'completed',
          createdAt: new Date().toISOString()
        });
      }
      
      const { error: insertError } = await supabase.from('transactions').insert(newTxs);
      if (insertError) {
        console.error("Failed to backfill tx:", insertError);
      } else {
        console.log(`Successfully backfilled ${missingTxCount} transactions for ${prod.title}.`);
      }
    } else {
      console.log(`Product ${prod.id} is fine.`);
    }
  }
  
  console.log("Backfill complete.");
}

backfill();
