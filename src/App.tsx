import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, ProductImage, GiftCardSubmission, BtcWebhookLog, PromoCode } from './types';
import { Navbar } from './components/Navbar';
import { MarketplaceFeed } from './components/MarketplaceFeed';
import { PricingPage } from './components/PricingPage';
import { SellerStudio } from './components/SellerStudio';
import { AdminPortal } from './components/AdminPortal';
import { MyProducts } from './components/MyProducts';
import { SocialProofNotifications } from './components/SocialProofNotifications';

import { PurchaseModal } from './components/PurchaseModal';
import { AuthPage } from './components/AuthPage';
import { Award, CheckCircle2, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'marketplace' | 'pricing' | 'upload' | 'admin' | 'auth' | 'my-products'>('marketplace');

  const defaultGuestUser: UserProfile = {
    id: 'user-guest',
    email: 'guest@lenscanvas.com',
    fullName: 'Guest User',
    role: 'buyer',
    sellerStatus: 'none',
    isLoggedIn: false,
  };

  // User State - initialize from localStorage if available
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('lenscanvas_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return defaultGuestUser;
      }
    }
    return defaultGuestUser;
  });

  // Auth Prompt State
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);

  // Application Data State
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCardSubmission[]>([]);
  const [btcWebhooks, setBtcWebhooks] = useState<BtcWebhookLog[]>([]);
  const [pendingSellers, setPendingSellers] = useState<UserProfile[]>([]);
  const [managedSellers, setManagedSellers] = useState<UserProfile[]>([]);
  const [verifiedBtcSellersCount, setVerifiedBtcSellersCount] = useState<number>(0);
  const [adminBtcAddress, setAdminBtcAddress] = useState<string>('bc1q9v8k7m3p2w0x9z8y7x6w5v4u3t2s1r0q9p8o7n');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductImage | null>(null);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Sync state with server backend on startup
  const fetchState = async () => {
    try {
      const savedUserStr = localStorage.getItem('lenscanvas_user');
      let userIdParam = '';
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.id && savedUser.id !== 'user-guest') {
            userIdParam = `?userId=${savedUser.id}`;
          }
        } catch (e) {}
      }

      const res = await fetch(`/api/state${userIdParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.giftCards) setGiftCards(data.giftCards);
        if (data.btcWebhooks) setBtcWebhooks(data.btcWebhooks);
        if (data.pendingSellers) setPendingSellers(data.pendingSellers);
        if (data.managedSellers) setManagedSellers(data.managedSellers);
        if (data.verifiedBtcSellersCount !== undefined) setVerifiedBtcSellersCount(data.verifiedBtcSellersCount);
        if (data.adminBtcAddress) setAdminBtcAddress(data.adminBtcAddress);
        if (data.promoCodes) setPromoCodes(data.promoCodes);
        if (data.user) {
          const updatedUser = { ...data.user, isLoggedIn: true };
          setCurrentUser(updatedUser);
          localStorage.setItem('lenscanvas_user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.warn('Backend server state fetch fallback to local mock:', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Auth Callbacks
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('lenscanvas_user', JSON.stringify(user));
    setAuthModalPrompt(undefined);
    setCelebrationMsg(`Welcome, ${user.fullName || user.email}! You are signed in.`);
    setTimeout(() => setCelebrationMsg(null), 5000);
    if (activeTab === 'auth') {
      if (user.role === 'admin') {
        setActiveTab('admin');
      } else if (user.role === 'pending_seller' || user.sellerStatus === 'pending_verification') {
        setActiveTab('pricing');
      } else {
        setActiveTab('marketplace');
      }
    }
  };

  const handleSignOut = () => {
    setCurrentUser(defaultGuestUser);
    localStorage.removeItem('lenscanvas_user');
    setCelebrationMsg('You have been signed out.');
    setTimeout(() => setCelebrationMsg(null), 4000);
  };

  const handleOpenAuthModal = (promptMsg?: string) => {
    setAuthModalPrompt(promptMsg);
    setActiveTab('auth');
  };



  // Callback when BTC Webhook simulation succeeds or manual confirm
  const handleBtcUpgradeSuccess = (txHash: string) => {
    if (txHash === 'manual_pending') {
      const updatedUser = {
        ...currentUser,
        role: 'pending_seller' as UserRole,
        sellerStatus: 'pending_verification' as any,
        paymentMethod: 'btc' as any
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('lenscanvas_user', JSON.stringify(updatedUser));
  
      setCelebrationMsg('⏳ Payment confirmation received! Your account is now Pending Admin Verification.');
      setTimeout(() => setCelebrationMsg(null), 6000);
      fetchState();
    } else {
      const updatedUser = {
        ...currentUser,
        role: 'seller' as UserRole,
        sellerStatus: 'active_lifetime' as any,
        paymentMethod: 'btc' as any,
        txHash,
        upgradedAt: new Date().toISOString()
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('lenscanvas_user', JSON.stringify(updatedUser));
  
      setCelebrationMsg('🎉 Congratulations! Blockchain confirmation received. You are now a Verified Lifetime Seller ($1,500 Deposit).');
      setTimeout(() => setCelebrationMsg(null), 6000);
      fetchState();
    }
  };

  // Callback when Gift Card is submitted
  const handleGiftCardSubmitted = (submission: GiftCardSubmission) => {
    setGiftCards([submission, ...giftCards]);
    const updatedUser = {
      ...currentUser,
      role: 'pending_seller' as UserRole,
      sellerStatus: 'pending_verification' as any,
      paymentMethod: 'gift_card' as any
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('lenscanvas_user', JSON.stringify(updatedUser));

    setCelebrationMsg('⏳ Gift card code & PIN submitted! Your account is now Pending Admin Verification.');
    setTimeout(() => setCelebrationMsg(null), 6000);
    fetchState();
  };

  // Callback when Admin approves or rejects gift card
  const handleVerifyGiftCard = async (submissionId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const res = await fetch('/api/admin/verify-gift-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action, notes })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifySeller = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/verify-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  // Callback when seller uploads artwork
  const handleToggleSellerStatus = async (userId: string, action: 'suspend' | 'restore') => {
    try {
      const res = await fetch('/api/admin/toggle-seller-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        fetchState();
      } else {
        alert('Failed to toggle seller status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error toggling seller status.');
    }
  };

  // Callback when seller uploads artwork
  const handleUploadSuccess = (newProduct: ProductImage) => {
    setProducts([newProduct, ...products]);
    setActiveTab('marketplace');
    setCelebrationMsg(`✨ "${newProduct.title}" has been published to the Marketplace Feed!`);
    setTimeout(() => setCelebrationMsg(null), 5000);
  };

  const pendingCount = giftCards.filter((g) => g.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 font-sans flex flex-col selection:bg-[#FF6321] selection:text-white">
      
      {/* Global Notifications Engine */}
      <SocialProofNotifications />

      {/* Main Header Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={setActiveTab}
        pendingCount={pendingCount}
        onSignOut={handleSignOut}
        onOpenAuth={() => handleOpenAuthModal()}
      />

      {/* Notification Banner */}
      {celebrationMsg && (
        <div className="artistic-gradient-bg text-white px-4 py-3 text-center font-bold text-xs flex items-center justify-center gap-2 shadow-lg glow-orange animate-fade-in tracking-wide">
          <Sparkles className="w-4 h-4 text-white animate-spin" />
          <span>{celebrationMsg}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentUser.role === 'admin' ? (
            <AdminPortal
              currentUser={currentUser}
              products={products}
              giftCards={giftCards}
              btcWebhooks={btcWebhooks}
              pendingSellers={pendingSellers}
              managedSellers={managedSellers}
              verifiedBtcSellersCount={verifiedBtcSellersCount}
              adminBtcAddress={adminBtcAddress}
              promoCodes={promoCodes}
              onVerifyGiftCard={handleVerifyGiftCard}
              onVerifySeller={handleVerifySeller}
              onToggleSellerStatus={handleToggleSellerStatus}
              onProductPosted={fetchState}
            />
        ) : (
          <>
            {activeTab === 'marketplace' && (
              <MarketplaceFeed
                products={products}
                currentUser={currentUser}
                onSelectProduct={setSelectedProduct}
                onNavigatePricing={() => setActiveTab('pricing')}
              />
            )}

            {activeTab === 'pricing' && (
              <PricingPage
                currentUser={currentUser}
                adminBtcAddress={adminBtcAddress}
                promoCodes={promoCodes}
                onUpgradeSuccess={handleBtcUpgradeSuccess}
                onGiftCardSubmitted={handleGiftCardSubmitted}
                onOpenAuth={handleOpenAuthModal}
              />
            )}

            {activeTab === 'upload' && (
              <SellerStudio
                currentUser={currentUser}
                onUploadSuccess={handleUploadSuccess}
                onNavigatePricing={() => setActiveTab('pricing')}
                onOpenAuth={handleOpenAuthModal}
              />
            )}

            {activeTab === 'auth' && (
              <AuthPage onLoginSuccess={handleAuthSuccess} promptMessage={authModalPrompt} />
            )}

            {activeTab === 'my-products' && (
              <MyProducts
                products={products}
                currentUser={currentUser}
                onDeleteSuccess={fetchState}
              />
            )}
          </>
        )}
      </main>

      {/* Artwork Purchase Modal */}
      {selectedProduct && (
        <PurchaseModal
          product={selectedProduct}
          currentUser={currentUser}
          onClose={() => setSelectedProduct(null)}
          onPurchaseComplete={() => fetchState()}
          onOpenAuth={handleOpenAuthModal}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 bg-[#0A0A0C] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-zinc-200 text-sm tracking-wide">Lens &amp; Canvas</span>
            <span className="text-zinc-400 font-serif-italic">— Photography &amp; Digital Art Vault</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
