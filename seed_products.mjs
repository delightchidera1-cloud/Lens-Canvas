import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = ['Photography', 'Digital Art', '3D Renders', 'Vectors', 'AI Generated'];
const titles = [
  "Neon Cityscape", "Mountain Peaks", "Ethereal Dream", "Abstract Gold",
  "Minimalist Interior", "Sci-Fi Corridor", "Geometric Pattern", "Startup Kit",
  "Synthwave Sunset", "Cybernetic Portrait", "Ocean Waves", "Forest Canopy",
  "Desert Dunes", "Arctic Glacier", "Volcanic Eruption", "Coral Reef",
  "Galactic Nebula", "Quantum Realm", "Microscopic Cell", "Macro Insect",
  "Vintage Car", "Modern Architecture", "Gothic Cathedral", "Abandoned Factory",
  "Bustling Market", "Tranquil Garden", "Stormy Seas", "Lightning Strike",
  "Aurora Borealis", "Solar Eclipse", "Lunar Landscape", "Martian Colony",
  "Deep Sea Diver", "Astronaut Walk", "Medieval Knight", "Futuristic Cyborg",
  "Steampunk City", "Cyberpunk Hacker", "Fantasy Dragon", "Mythical Unicorn",
  "Enchanted Forest", "Haunted Mansion", "Secret Cave", "Hidden Waterfall"
];

const adjectives = ["Epic", "Stunning", "Majestic", "Vibrant", "Serene", "Dynamic", "Cinematic", "Surreal"];

function generateMockProducts(count) {
  const products = [];
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const titleBase = titles[Math.floor(Math.random() * titles.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const title = `${adjective} ${titleBase}`;
    const price = Number((Math.random() * 200 + 15).toFixed(2));
    
    // Using picsum for highly varied, authentic looking beautiful random photos
    const watermarkedUrl = `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1600/1200`;
    
    products.push({
      title,
      description: `High quality ${category.toLowerCase()} asset featuring ${title.toLowerCase()}. Exclusive lifetime commercial rights included.`,
      category,
      price,
      resolution: "8K Ultra HD",
      format: "RAW / TIFF",
      watermarkedUrl
    });
  }
  return products;
}

const mockProducts = generateMockProducts(45); // Generate 45 unique products

async function seedProducts() {
  console.log("Fetching admin user to use as seller...");
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, fullName')
    .eq('id', 'user-admin')
    .single();

  if (adminError || !adminUser) {
    console.error("Admin user not found. Run seed_admin.mjs first.");
    process.exit(1);
  }

  console.log(`Using seller ID: ${adminUser.id} (${adminUser.fullName || 'Admin'})`);

  console.log("Clearing existing products...");
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log(`Inserting ${mockProducts.length} new mock products...`);
  
  const productsToInsert = mockProducts.map((p, index) => ({
    ...p,
    id: `prod-seed-${Date.now()}-${index}`,
    sellerId: adminUser.id,
    sellerName: adminUser.fullName || 'Admin Creator',
    license: 'Standard Commercial',
    originalSecureKey: 'mock-secure-key-12345',
    salesCount: Math.floor(Math.random() * 50),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() // Random past date
  }));

  // Insert in batches of 15 to avoid any payload limits
  const chunkSize = 15;
  for (let i = 0; i < productsToInsert.length; i += chunkSize) {
    const chunk = productsToInsert.slice(i, i + chunkSize);
    const { error: insertError } = await supabase
      .from('products')
      .insert(chunk);

    if (insertError) {
      console.error(`Failed to insert batch ${i}:`, insertError);
      return;
    }
  }

  console.log(`Successfully seeded ${productsToInsert.length} products!`);
}

seedProducts();
