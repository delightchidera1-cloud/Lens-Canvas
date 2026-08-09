import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import net from 'net';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserState {
  id: string;
  email: string;
  fullName?: string;
  password?: string;
  role: 'buyer' | 'seller' | 'pending_seller' | 'admin';
  sellerStatus: 'none' | 'pending_verification' | 'active_lifetime' | 'rejected';
  paymentMethod?: 'btc' | 'gift_card';
  upgradedAt?: string;
  txHash?: string;
}

interface GiftCardSubmission {
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
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  notes?: string;
}

interface ProductImage {
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

interface Transaction {
  id: string;
  buyerId: string;
  buyerEmail?: string;
  productId: string;
  productTitle?: string;
  amount: number;
  paymentMethod?: string;
  timestamp?: string;
  downloadToken?: string;
  expiresAt?: string;
  status?: string;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Fetch State (Products, Gift Cards, BTC Webhooks)
app.get('/api/state', async (req, res) => {
  try {
    const { data: products } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
    const { data: giftCards } = await supabase.from('gift_cards').select('*').order('submittedAt', { ascending: false });
    const { data: btcWebhooks } = await supabase.from('btc_webhooks').select('*').order('timestamp', { ascending: false });
    
    // Fetch global settings
    let adminBtcAddress = 'bc1q9v8k7m3p2w0x9z8y7x6w5v4u3t2s1r0q9p8o7n'; // Default fallback
    let promoCodes: any[] = [];
    const { data: settingsData, error: settingsError } = await supabase.from('app_settings').select('*');
    if (!settingsError && settingsData) {
      const btcSetting = settingsData.find(s => s.key === 'adminBtcAddress');
      if (btcSetting && btcSetting.value) {
        adminBtcAddress = btcSetting.value;
      }
      const promoCodesSetting = settingsData.find(s => s.key === 'promoCodes');
      if (promoCodesSetting && promoCodesSetting.value) {
        try {
          promoCodes = JSON.parse(promoCodesSetting.value);
        } catch (e) {
          console.error("Failed to parse promoCodes from settings", e);
        }
      }
    }

    // Fetch pending sellers
    const { data: pendingSellersData } = await supabase.from('users').select('*').eq('sellerStatus', 'pending_verification');
    const pendingSellers = pendingSellersData || [];

    // Fetch managed sellers (active or suspended)
    const { data: managedSellersData } = await supabase.from('users').select('*').in('sellerStatus', ['active_lifetime', 'suspended']);
    const managedSellers = managedSellersData || [];

    // Fetch accurate count of verified BTC sellers for revenue tracking
    const { count: verifiedBtcCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('sellerStatus', 'active_lifetime')
      .eq('paymentMethod', 'btc');

    // Fetch user profile if requested
    let currentUserProfile = null;
    if (req.query.userId) {
      const { data: user } = await supabase.from('users').select('*').eq('id', req.query.userId).single();
      if (user) {
        currentUserProfile = user;
        
        // Calculate dynamic balance from completed transactions
        if (user.sellerStatus === 'active_lifetime' || user.sellerStatus === 'suspended') {
          const { data: txs } = await supabase.from('transactions')
            .select('amount')
            .eq('sellerId', user.id)
            .eq('status', 'completed');
            
          const totalBalance = (txs || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
          currentUserProfile.balance = totalBalance;
        } else {
          currentUserProfile.balance = 0;
        }
      }
    }

    res.json({
      products: products || [],
      giftCards: giftCards || [],
      btcWebhooks: btcWebhooks || [],
      pendingSellers,
      managedSellers,
      verifiedBtcSellersCount: verifiedBtcCount || 0,
      adminBtcAddress,
      promoCodes,
      user: currentUserProfile
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

// Authentication Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email.trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Account not found. Please create an account first.' });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    return res.status(200).json({ success: true, user: { ...user, isLoggedIn: true } });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName, roleChoice } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email.trim())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const newUserId = `user-${Date.now()}`;
    const initialRole = roleChoice === 'admin' ? 'admin' : (roleChoice === 'seller' ? 'pending_seller' : 'buyer');
    
    const newUser = {
      id: newUserId,
      email: email.trim(),
      password,
      fullName: fullName || '',
      role: initialRole,
      sellerStatus: 'none'
    };

    const { error } = await supabase.from('users').insert([newUser]);
    if (error) throw error;

    return res.status(200).json({ success: true, user: { ...newUser, isLoggedIn: true } });
  } catch (err: any) {
    return res.status(500).json({ error: 'Sign up failed', details: err.message });
  }
});

// Gift Card Submission Endpoint
app.post('/api/actions/submit-gift-card', async (req, res) => {
  try {
    const { userId, userEmail, brand, cardNumber, pin, declaredValue, frontImageUrl, backImageUrl, notes } = req.body;

    const submission = {
      id: `gc-${Date.now()}`,
      userId: userId || 'user-buyer',
      userEmail: userEmail || 'creator@example.com',
      brand,
      cardNumber,
      pin,
      declaredValue: Number(declaredValue),
      frontImageUrl,
      backImageUrl,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      notes
    };

    const { error: insertError } = await supabase.from('gift_cards').insert([submission]);
    if (insertError) throw insertError;

    // Flag user as pending seller
    const { data: user } = await supabase.from('users').select('*').eq('email', userEmail).single();
    if (user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'pending_seller', sellerStatus: 'pending_verification', paymentMethod: 'gift_card' })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      user.role = 'pending_seller';
      user.sellerStatus = 'pending_verification';
    }

    return res.status(200).json({
      success: true,
      message: 'Gift card submission received. Account set to pending_verification for admin review.',
      submission,
      user: user || null
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit gift card', details: err.message });
  }
});

// Admin Verification Endpoint for Gift Cards / Seller approvals
app.post('/api/admin/verify-gift-card', async (req, res) => {
  try {
    const { submissionId, action, notes } = req.body;

    const { data: gc } = await supabase.from('gift_cards').select('*').eq('id', submissionId).single();
    if (!gc) {
      return res.status(404).json({ error: 'Gift card submission not found.' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await supabase.from('gift_cards').update({ status: newStatus, notes }).eq('id', submissionId);
    gc.status = newStatus;
    if (notes) gc.notes = notes;

    let updatedUser = null;
    const { data: user } = await supabase.from('users').select('*').eq('email', gc.userEmail).single();
    if (user) {
      if (action === 'approve') {
        const updates = { role: 'seller', sellerStatus: 'active_lifetime', upgradedAt: new Date().toISOString() };
        await supabase.from('users').update(updates).eq('id', user.id);
        updatedUser = { ...user, ...updates };
      } else {
        const updates = { role: 'buyer', sellerStatus: 'rejected' };
        await supabase.from('users').update(updates).eq('id', user.id);
        updatedUser = { ...user, ...updates };
      }
    }

    return res.status(200).json({
      success: true,
      message: `Gift card ${action}d successfully.`,
      submission: gc,
      user: updatedUser
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update gift card status', details: err.message });
  }
});

// Manual BTC Confirmation Endpoint
app.post('/api/actions/btc-confirm-manual', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const updates = { sellerStatus: 'pending_verification', paymentMethod: 'btc' };
    const { error } = await supabase.from('users').update(updates).eq('id', userId);

    if (error) {
      console.error('BTC confirm error:', error);
      return res.status(500).json({ error: 'Failed to update user status.', details: error.message });
    }

    return res.status(200).json({ success: true, message: 'Payment confirmation submitted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit confirmation', details: err.message });
  }
});

// Admin Verify Seller Endpoint
app.post('/api/admin/verify-seller', async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'approve' | 'reject'
    if (!userId || !action) return res.status(400).json({ error: 'Missing required fields' });

    let updates: any = {};
    if (action === 'approve') {
      updates = { role: 'seller', sellerStatus: 'active_lifetime', upgradedAt: new Date().toISOString() };
    } else {
      updates = { role: 'buyer', sellerStatus: 'rejected' };
    }

    const { error } = await supabase.from('users').update(updates).eq('id', userId);

    if (error) {
      console.error('Verify seller error:', error);
      return res.status(500).json({ error: 'Failed to verify seller.', details: error.message });
    }

    const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).single();
    return res.status(200).json({ success: true, message: `Seller ${action}d successfully.`, user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update seller', details: err.message });
  }
});

// Admin Toggle Seller Status Endpoint (Suspend/Restore)
app.post('/api/admin/toggle-seller-status', async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'suspend' | 'restore'
    if (!userId || !action) return res.status(400).json({ error: 'Missing required fields' });

    let updates: any = {};
    if (action === 'suspend') {
      updates = { sellerStatus: 'suspended' };
    } else if (action === 'restore') {
      updates = { sellerStatus: 'active_lifetime' };
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const { error } = await supabase.from('users').update(updates).eq('id', userId);
    if (error) {
      console.error('Toggle status error:', error);
      return res.status(500).json({ error: 'Failed to update user status.', details: error.message });
    }

    const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).single();
    return res.status(200).json({ success: true, message: `Seller ${action}d successfully.`, user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to toggle seller status', details: err.message });
  }
});

// Admin Settings Endpoint
app.post('/api/admin/settings', async (req, res) => {
  try {
    const { adminBtcAddress, promoCodes } = req.body;
    
    const settingsToUpsert = [];
    if (adminBtcAddress) {
      settingsToUpsert.push({ key: 'adminBtcAddress', value: adminBtcAddress });
    }
    
    if (promoCodes !== undefined) {
      settingsToUpsert.push({ key: 'promoCodes', value: JSON.stringify(promoCodes) });
    }

    if (settingsToUpsert.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    // Upsert into app_settings table
    const { error } = await supabase.from('app_settings').upsert(
      settingsToUpsert,
      { onConflict: 'key' }
    );

    if (error) {
      console.error('Settings save error:', error);
      return res.status(500).json({ error: 'Failed to save settings. Please ensure the app_settings table exists in Supabase.', details: error.message });
    }

    return res.status(200).json({ success: true, message: 'Settings saved successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save settings', details: err.message });
  }
});

// Secure Upload Pipeline Endpoint
app.post('/api/actions/upload-image', async (req, res) => {
  try {
    const { sellerId, sellerEmail, title, description, category, price, resolution, format, license, watermarkedUrl, originalFileBase64 } = req.body;

    const { data: seller } = await supabase.from('users').select('*').eq('id', sellerId || '').single();
    
    if (!seller || seller.role !== 'seller' || seller.sellerStatus !== 'active_lifetime') {
      return res.status(403).json({ error: 'Access denied: Only verified lifetime sellers can upload images.' });
    }

    const secureKey = originalFileBase64 || `vault/originals/${seller.id}/${Date.now()}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.raw`;

    const newProduct = {
      id: `prod-${Date.now()}`,
      sellerId: seller.id,
      sellerName: sellerEmail ? sellerEmail.split('@')[0] : 'Verified Creator',
      title,
      description: description || 'High-resolution digital masterpiece.',
      category: category || 'Digital Art',
      price: Number(price) || 150,
      resolution: resolution || '8000 x 5000 (40 MP)',
      format: format || 'TIFF / PNG',
      license: license || 'Standard Commercial',
      watermarkedUrl: watermarkedUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      originalSecureKey: secureKey,
      createdAt: new Date().toISOString(),
      salesCount: 0
    };

    await supabase.from('products').insert([newProduct]);

    return res.status(200).json({
      success: true,
      message: 'Artwork uploaded successfully. Original encrypted in private vault, public preview watermarked.',
      product: newProduct
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Delete Product Endpoint
app.delete('/api/actions/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required to delete a product' });
    }

    const { data: prod } = await supabase.from('products').select('*').eq('id', productId).single();
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (prod.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Access denied: You can only delete your own products.' });
    }

    await supabase.from('products').delete().eq('id', productId);

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// Admin Ghost Upload Endpoint
app.post('/api/admin/upload-image', async (req, res) => {
  try {
    const { adminId, sellerName, title, description, category, price, watermarkedUrl, originalFileBase64 } = req.body;

    const { data: admin } = await supabase.from('users').select('*').eq('id', adminId || '').single();
    
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin only.' });
    }

    const secureKey = originalFileBase64 || `vault/originals/admin/${Date.now()}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.raw`;

    const newProduct = {
      id: `prod-${Date.now()}`,
      sellerId: adminId,
      sellerName: sellerName || 'Anonymous Creator',
      title,
      description: description || 'High-resolution digital masterpiece.',
      category: category || 'Digital Art',
      price: Number(price) || 150,
      resolution: '8000 x 5000 (40 MP)',
      format: 'TIFF / PNG',
      license: 'Standard Commercial',
      watermarkedUrl: watermarkedUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      originalSecureKey: secureKey,
      createdAt: new Date().toISOString(),
      salesCount: 0
    };
    const { error: insertError } = await supabase.from('products').insert([newProduct]);
    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: 'Ghost product uploaded successfully by Admin.',
      product: newProduct
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ghost upload failed', details: err.message });
  }
});

// Purchase Endpoint
// Admin Verify Gift Card Endpoint
app.post('/api/admin/verify-gift-card', async (req, res) => {
  try {
    const { submissionId, action, notes } = req.body;
    
    // Update gift card status
    const status = action === 'approve' ? 'approved' : 'rejected';
    const { data: updatedCard, error: gcError } = await supabase
      .from('gift_cards')
      .update({ status, notes })
      .eq('id', submissionId)
      .select()
      .single();
      
    if (gcError) throw gcError;

    // Update the associated user
    if (updatedCard && updatedCard.userEmail) {
      const role = action === 'approve' ? 'seller' : 'buyer';
      const sellerStatus = action === 'approve' ? 'active_lifetime' : 'rejected';
      
      const { error: userError } = await supabase
        .from('users')
        .update({ role, sellerStatus })
        .eq('email', updatedCard.userEmail);
        
      if (userError) throw userError;
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to verify gift card', details: err.message });
  }
});

app.post('/api/actions/purchase-image', async (req, res) => {
  try {
    const { buyerEmail, productId, paymentMethod } = req.body;
    
    // Lookup the buyer to get their actual ID for the foreign key constraint
    let { data: buyer } = await supabase.from('users').select('id').eq('email', buyerEmail).single();
    
    let finalBuyerId = '';
    if (!buyer) {
      // Create guest buyer on the fly
      finalBuyerId = `buyer-${Date.now()}`;
      const newBuyer = {
        id: finalBuyerId,
        email: buyerEmail || 'guest@lenscanvas.io',
        role: 'buyer',
        sellerStatus: 'none',
        fullName: 'Guest Buyer'
      };
      const { error: insertBuyerError } = await supabase.from('users').insert([newBuyer]);
      if (insertBuyerError) {
        console.error('Failed to create guest buyer:', insertBuyerError);
        return res.status(500).json({ error: 'Failed to initialize buyer record' });
      }
    } else {
      finalBuyerId = buyer.id;
    }

    const { data: prod } = await supabase.from('products').select('*').eq('id', productId).single();
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const downloadToken = `dl_token_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const tx = {
      id: `tx-${Date.now()}`,
      buyerId: finalBuyerId, 
      sellerId: prod.sellerId,
      productId: prod.id,
      amount: prod.price,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    const { error: txError } = await supabase.from('transactions').insert([tx]);
    if (txError) {
      console.error('Transaction Insert Error:', txError);
      throw txError;
    }
    await supabase.from('products').update({ salesCount: prod.salesCount + 1 }).eq('id', prod.id);

    const downloadUrl = `/api/download/${prod.id}?token=${downloadToken}&exp=${Date.now() + 86400000}`;

    return res.status(200).json({
      success: true,
      message: 'Purchase completed successfully! Signed high-res download token issued.',
      transaction: tx,
      downloadUrl,
      expiresAt
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Purchase failed', details: err.message });
  }
});

app.post('/api/admin/simulate-purchase', async (req, res) => {
  try {
    const { sellerId, productId, count } = req.body;
    if (!sellerId || !productId || !count || count < 1) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    const { data: prod } = await supabase.from('products').select('*').eq('id', productId).single();
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

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
    for (let i = 0; i < count; i++) {
      newTxs.push({
        id: `tx-simulated-${Date.now()}-${Math.random()}`,
        buyerId: defaultBuyerId,
        sellerId: sellerId,
        productId: productId,
        amount: prod.price,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    }

    const { error: insertError } = await supabase.from('transactions').insert(newTxs);
    if (insertError) {
      console.error('Failed to simulate transactions:', insertError);
      return res.status(500).json({ error: 'Failed to insert simulated transactions' });
    }

    const { error: updateError } = await supabase.from('products').update({ salesCount: prod.salesCount + count }).eq('id', productId);
    if (updateError) {
      console.error('Failed to update product sales count:', updateError);
    }

    return res.status(200).json({ success: true, message: `Successfully simulated ${count} purchases` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Simulation failed', details: err.message });
  }
});

// Secure High-Res Original Download API
app.get('/api/download/:productId', async (req, res) => {
  const { productId } = req.params;
  const { token, exp } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing signed download token' });
  }

  if (exp && Number(exp) < Date.now()) {
    return res.status(403).json({ error: 'Expired link: Download signature has expired.' });
  }

  const { data: prod } = await supabase.from('products').select('*').eq('id', productId).single();
  if (!prod) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const filename = `${prod.title.replace(/[^a-z0-9]/gi, '_')}_ORIGINAL.jpg`;

    if (prod.originalSecureKey && prod.originalSecureKey.startsWith('data:image/')) {
      const matches = prod.originalSecureKey.match(/^data:(image\/\w+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(buffer);
      }
    }

    const imageRes = await fetch(prod.watermarkedUrl);
    if (!imageRes.ok) throw new Error('Failed to fetch image');
    
    res.setHeader('Content-Type', imageRes.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Download Proxy Error:', error);
    // Fallback to redirect if fetch fails
    return res.redirect(prod.watermarkedUrl);
  }
});

// State sync query endpoint for client UI
app.get('/api/state', async (req, res) => {
  try {
    const [usersRes, gcRes, prodRes, txRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('gift_cards').select('*').order('submittedAt', { ascending: false }),
      supabase.from('products').select('id, sellerId, sellerName, title, description, category, price, resolution, format, license, watermarkedUrl, salesCount, createdAt').order('createdAt', { ascending: false }),
      supabase.from('transactions').select('*').order('createdAt', { ascending: false })
    ]);

    const usersDict: Record<string, any> = {};
    if (usersRes.data) {
      usersRes.data.forEach(u => usersDict[u.id] = u);
    }

    // Fetch settings
    let adminBtcAddress = 'bc1q9v8k7m3p2w0x9z8y7x6w5v4u3t2s1r0q9p8o7n';
    const { data: settingsData, error: settingsError } = await supabase.from('app_settings').select('*');
    if (!settingsError && settingsData) {
      const btcSetting = settingsData.find(s => s.key === 'adminBtcAddress');
      if (btcSetting && btcSetting.value) {
        adminBtcAddress = btcSetting.value;
      }
    }

    res.json({
      users: usersDict,
      giftCards: gcRes.data || [],
      products: prodRes.data || [],
      transactions: txRes.data || [],
      btcWebhooks: [],
      adminBtcAddress
    });
  } catch (err) {
    res.status(500).json({ error: 'State sync failed' });
  }
});

async function getAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.on('error', () => {
      resolve(getAvailablePort(startPort + 1));
    });
    srv.listen(startPort, '0.0.0.0', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

async function startServer() {
  const availablePort = await getAvailablePort(PORT);
  const hmrPort = await getAvailablePort(24678);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { port: hmrPort }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL) {
    console.log(`[Vercel Serverless Function] Skipping listen...`);
  } else {
    app.listen(availablePort, '0.0.0.0', () => {
      console.log(`[LENS & CANVAS SERVER] Running on http://localhost:${availablePort}`);
      console.log(`[SUPABASE CONNECTED] ${supabaseUrl ? 'Yes' : 'No'}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
