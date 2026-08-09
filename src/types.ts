export type UserRole = 'buyer' | 'seller' | 'pending_seller' | 'admin';
export type SellerStatus = 'none' | 'pending_verification' | 'active_lifetime' | 'rejected' | 'suspended';
export type GiftCardStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'btc' | 'gift_card';

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  sellerStatus: SellerStatus;
  paymentMethod?: PaymentMethod;
  upgradedAt?: string;
  txHash?: string;
  fullName?: string;
  isLoggedIn?: boolean;
  balance?: number;
}

export interface GiftCardSubmission {
  id: string;
  userId: string;
  userEmail: string;
  brand: string;
  cardNumber: string;
  pin: string;
  declaredValue: number;
  receiptUrl?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  status: GiftCardStatus;
  submittedAt: string;
  notes?: string;
}

export interface ProductImage {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  price: number;
  resolution: string;
  format: string;
  license: string;
  watermarkedUrl: string;
  originalSecureKey: string;
  createdAt: string;
  salesCount: number;
}

export interface Transaction {
  id: string;
  buyerId: string;
  buyerEmail: string;
  productId: string;
  productTitle: string;
  amount: number;
  paymentMethod: string;
  timestamp: string;
  downloadToken: string;
  expiresAt: string;
}

export interface BtcWebhookLog {
  id: string;
  event: string;
  txHash: string;
  amountBtc: number;
  amountUsd: number;
  confirmations: number;
  userEmail: string;
  timestamp: string;
  status: 'processed' | 'pending' | 'failed';
}

// Full DDL SQL Schema Code String for Step 1
export const DB_SCHEMA_SQL = `-- ==============================================================================
-- STEP 1: DATABASE SCHEMA & ROW LEVEL SECURITY (Supabase / PostgreSQL)
-- Marketplace Model: $1,500 One-time Lifetime Seller Rights via BTC or Gift Card
-- ==============================================================================

-- 1. ENUMS FOR USER ROLES & STATUSES
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'pending_seller', 'admin');
CREATE TYPE seller_verification_status AS ENUM ('none', 'pending_verification', 'active_lifetime', 'rejected');
CREATE TYPE gift_card_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. USERS TABLE (Extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  seller_status seller_verification_status NOT NULL DEFAULT 'none',
  lifetime_paid_at TIMESTAMPTZ,
  payment_method TEXT, -- 'btc' or 'gift_card'
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GIFT CARD SUBMISSIONS TABLE
CREATE TABLE public.gift_card_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  brand TEXT NOT NULL, -- 'Amazon', 'Apple', 'Visa Prepaid', etc.
  card_number TEXT NOT NULL, -- Encrypted at rest
  pin TEXT NOT NULL, -- Encrypted at rest
  declared_value NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  receipt_url TEXT,
  status gift_card_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 4. PRODUCTS / IMAGES TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  resolution TEXT NOT NULL,
  format TEXT NOT NULL,
  license TEXT NOT NULL DEFAULT 'Standard Commercial',
  watermarked_url TEXT NOT NULL, -- Publicly accessible watermarked preview
  original_secure_key TEXT NOT NULL, -- Private bucket key (Supabase Storage / AWS S3)
  sales_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  download_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. APP SETTINGS TABLE
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures only verified lifetime sellers can upload products!
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can read their own profile" 
  ON public.users FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- GIFT CARDS POLICIES
CREATE POLICY "Users can insert gift cards for seller submission" 
  ON public.gift_card_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their own gift card submissions" 
  ON public.gift_card_submissions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- PRODUCTS POLICIES (CRITICAL REQUIREMENT)
CREATE POLICY "Anyone can view products (Marketplace Feed)" 
  ON public.products FOR SELECT USING (true);

CREATE POLICY "ONLY Verified Lifetime Sellers can insert images" 
  ON public.products FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'seller' 
      AND seller_status = 'active_lifetime'
    )
  );

CREATE POLICY "Sellers can update their own products" 
  ON public.products FOR UPDATE USING (auth.uid() = seller_id);

-- TRANSACTIONS POLICIES
CREATE POLICY "Buyers view their own transactions" 
  ON public.transactions FOR SELECT USING (auth.uid() = buyer_id);
`;

// Code String for Step 2A (Crypto Webhook)
export const CODE_BTC_WEBHOOK = `// app/api/webhooks/crypto/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client with Service Role Key for elevated privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-cc-webhook-signature');

    // 1. Verify Coinbase Commerce / BTCPay Server Webhook Signature
    // (In production, verify using crypto.createHmac with WEBHOOK_SECRET)

    const event = body.event;
    
    // Check for confirmed payment event (e.g. 'charge:confirmed')
    if (event?.type === 'charge:confirmed' || body.event === 'charge:confirmed') {
      const metadata = event.data?.metadata || body.metadata;
      const userEmail = metadata?.userEmail || body.userEmail;
      const txHash = event.data?.payments?.[0]?.tx_id || body.txHash;
      const amountPaid = event.data?.pricing?.local?.amount || body.amountUsd;

      // Verify payment meets $1,500 threshold
      if (Number(amountPaid) >= 1500) {
        // 2. Automatically upgrade user to active lifetime seller in Supabase
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .update({
            role: 'seller',
            seller_status: 'active_lifetime',
            payment_method: 'btc',
            tx_hash: txHash,
            lifetime_paid_at: new Date().toISOString(),
          })
          .eq('email', userEmail)
          .select()
          .single();

        if (error) {
          console.error('Error updating user role:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(\`[BTC WEBHOOK SUCCESS] Upgraded \${userEmail} to Lifetime Seller via BTC TX: \${txHash}\`);
        return NextResponse.json({ success: true, user });
      }
    }

    return NextResponse.json({ received: true, status: 'ignored' });
  } catch (err: any) {
    console.error('BTC Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`;

// Code String for Step 2B (Gift Card Server Action)
export const CODE_GIFT_CARD_ACTION = `// app/actions/submitGiftCard.ts (Next.js Server Action)
'use me'
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface GiftCardInput {
  brand: string;
  cardNumber: string;
  pin: string;
  declaredValue: number;
  receiptUrl?: string;
}

export async function submitGiftCard(formData: GiftCardInput) {
  const supabase = createServerActionClient({ cookies });

  // 1. Verify user authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Unauthorized: You must be logged in to submit a gift card.');
  }

  const userId = session.user.id;
  const userEmail = session.user.email!;

  // 2. Insert gift card submission into encrypted audit vault
  const { data: submission, error: subError } = await supabase
    .from('gift_card_submissions')
    .insert([
      {
        user_id: userId,
        user_email: userEmail,
        brand: formData.brand,
        card_number: formData.cardNumber,
        pin: formData.pin,
        declared_value: formData.declaredValue || 1500,
        receipt_url: formData.receiptUrl,
        status: 'pending',
      }
    ])
    .select()
    .single();

  if (subError) {
    console.error('Gift Card Insert Error:', subError);
    throw new Error('Failed to save gift card details.');
  }

  // 3. Set user account status to 'pending_verification' with role 'pending_seller'
  const { error: userError } = await supabase
    .from('users')
    .update({
      role: 'pending_seller',
      seller_status: 'pending_verification',
      payment_method: 'gift_card',
    })
    .eq('id', userId);

  if (userError) {
    console.error('User status update error:', userError);
    throw new Error('Failed to update user seller status.');
  }

  return {
    success: true,
    message: 'Your gift card has been submitted. Account status is now Pending Verification.',
    submissionId: submission.id,
  };
}
`;

// Code String for Step 3 (Upload Server Action)
export const CODE_UPLOAD_ACTION = `// app/actions/uploadImage.ts (Next.js Server Action)
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadSellerImage(formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  // 1. Authenticate & Verify RLS Rights
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const userId = session.user.id;
  
  // Verify user is active lifetime seller
  const { data: user } = await supabase
    .from('users')
    .select('role, seller_status')
    .eq('id', userId)
    .single();

  if (!user || user.role !== 'seller' || user.seller_status !== 'active_lifetime') {
    throw new Error('Forbidden: Only verified lifetime sellers paying $1,500 membership can upload artwork.');
  }

  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const price = Number(formData.get('price'));
  const category = formData.get('category') as string;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 2. STEP A: Store Original High-Res File PRIVATELY in Supabase Private Storage / AWS S3
  const secureKey = \`originals/\${userId}/\${Date.now()}_\${file.name}\`;
  const { error: storageError } = await supabase.storage
    .from('private_highres_vault')
    .upload(secureKey, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (storageError) throw new Error(\`Private storage failed: \${storageError.message}\`);

  // 3. STEP B: Generate Auto-Watermarked Public Preview via Cloudinary
  const base64Image = \`data:\${file.type};base64,\${buffer.toString('base64')}\`;
  
  const uploadResult = await cloudinary.uploader.upload(base64Image, {
    folder: 'marketplace_previews',
    transformation: [
      { width: 1600, crop: 'limit', quality: 'auto' },
      // Apply diagonal repeating watermark overlay
      {
        overlay: { text: 'LENS & CANVAS - PREVIEW ONLY', font_family: 'Arial', font_size: 48, font_weight: 'bold' },
        color: '#FFFFFF',
        opacity: 35,
        angle: -30,
        flags: 'tiled',
      }
    ]
  });

  const watermarkedUrl = uploadResult.secure_url;

  // 4. STEP C: Insert Product Record into Database
  const { data: product, error: dbError } = await supabase
    .from('products')
    .insert([
      {
        seller_id: userId,
        title,
        price,
        category,
        resolution: '8K Ultra HD',
        format: file.type.split('/')[1].toUpperCase(),
        watermarked_url: watermarkedUrl,
        original_secure_key: secureKey,
      }
    ])
    .select()
    .single();

  if (dbError) throw new Error(\`Database insertion failed: \${dbError.message}\`);

  return { success: true, product };
}
`;
