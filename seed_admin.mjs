import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  const adminUser = {
    id: 'user-admin',
    email: 'admin@lensandcanvas.io',
    password: 'admin123', // Hardcoded plaintext password for the mock login
    fullName: 'Vault Administrator',
    role: 'admin',
    sellerStatus: 'active_lifetime'
  };

  console.log("Checking if admin exists...");
  const { data: existingAdmin, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', adminUser.email)
    .single();

  if (existingAdmin) {
    console.log("Admin already exists. Updating password...");
    const { error: updateError } = await supabase
      .from('users')
      .update(adminUser)
      .eq('email', adminUser.email);
      
    if (updateError) {
      console.error("Failed to update admin:", updateError);
    } else {
      console.log("Admin successfully updated in database!");
    }
  } else {
    console.log("Admin not found. Inserting...");
    const { error: insertError } = await supabase
      .from('users')
      .insert([adminUser]);
      
    if (insertError) {
      console.error("Failed to insert admin:", insertError);
    } else {
      console.log("Admin successfully inserted into database!");
    }
  }
}

seedAdmin();
