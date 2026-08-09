import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Using key starting with:", supabaseKey.substring(0, 15));
  try {
    const { data, error } = await supabase.from('products').insert([{
      id: 'prod-' + Date.now(),
      sellerId: 'ghost-123',
      sellerName: 'Test',
      title: 'Test',
      description: 'Test',
      category: 'Test',
      price: 150,
      resolution: '8000x5000',
      format: 'TIFF',
      license: 'Standard',
      watermarkedUrl: 'test',
      originalSecureKey: 'test',
      createdAt: new Date().toISOString(),
      salesCount: 0
    }]);
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

test();
