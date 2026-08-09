import React, { useState } from 'react';
import { UserProfile, GiftCardSubmission, PromoCode } from '../types';
import { BtcCheckout } from './BtcCheckout';
import { GiftCardForm } from './GiftCardForm';
import { Bitcoin, CreditCard, Sparkles, CheckCircle, ShieldCheck, Zap, Award, Image, DollarSign, Clock } from 'lucide-react';

interface PricingPageProps {
  currentUser: UserProfile;
  adminBtcAddress: string;
  promoCodes?: PromoCode[];
  onUpgradeSuccess: (txHash?: string) => void;
  onGiftCardSubmitted: (submission: GiftCardSubmission) => void;
  onOpenAuth?: (promptMsg?: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  currentUser,
  adminBtcAddress,
  promoCodes = [],
  onUpgradeSuccess,
  onGiftCardSubmitted,
  onOpenAuth,
}) => {
  const [activePaymentTab, setActivePaymentTab] = useState<'btc' | 'gift_card'>('btc');

  if (currentUser?.sellerStatus === 'pending_verification') {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500 glow-orange mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white">Your Request is Under Review</h2>
        <p className="text-zinc-400 text-lg">
          We have received your payment submission and it is currently being verified by our admin team. 
          You will be notified once your Lifetime Seller status is approved. Please do not submit again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 px-4">
      
      {/* Hero Pricing Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF854D] text-xs font-semibold tracking-wide">
          <Award className="w-3.5 h-3.5 text-[#FF6321]" />
          Exclusive Creator Access
        </div>
        
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black text-white tracking-tight leading-tight">
          One-Time <span className="artistic-gradient-text font-serif-italic">$1,500 Lifetime</span> Membership
        </h1>

        <p className="text-base text-zinc-300 leading-relaxed font-sans">
          Say goodbye to 30% marketplace commissions and recurring monthly subscriptions. Pay a single $1,500 deposit via <strong className="text-[#FF854D]">Bitcoin</strong> or <strong className="text-[#E040FB]">Brand Gift Cards</strong> to gain permanent, unthrottled upload rights to our high-resolution fine art vault. Keep 100% of your photo &amp; digital art sales.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card border border-zinc-800/80 p-5 rounded-2xl space-y-2 hover:border-[#FF6321]/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-white text-base">0% Marketplace Commission</h4>
          <p className="text-xs text-zinc-400">You retain 100% of the revenue from every high-res original download.</p>
        </div>

        <div className="glass-card border border-zinc-800/80 p-5 rounded-2xl space-y-2 hover:border-[#FF6321]/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center text-[#FF854D]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-white text-base">Encrypted Vault Storage</h4>
          <p className="text-xs text-zinc-400">Original RAW/TIFF files stored in secure server storage, watermarked previews auto-generated.</p>
        </div>

        <div className="glass-card border border-zinc-800/80 p-5 rounded-2xl space-y-2 hover:border-[#7928CA]/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#7928CA]/20 border border-[#7928CA]/40 flex items-center justify-center text-[#E040FB]">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-white text-base">No Credit Card Required</h4>
          <p className="text-xs text-zinc-400">Pay strictly via Bitcoin (automated confirmation) or major Brand Gift Cards.</p>
        </div>
      </div>

      {/* Payment Option Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-3 border-b border-zinc-800/80 pb-4">
          <button
            onClick={() => setActivePaymentTab('btc')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              activePaymentTab === 'btc'
                ? 'bg-[#FF6321] text-white glow-orange shadow-lg'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Bitcoin className="w-5 h-5 text-amber-300" />
            Option A: Bitcoin (BTC)
          </button>

          <button
            onClick={() => setActivePaymentTab('gift_card')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              activePaymentTab === 'gift_card'
                ? 'bg-[#7928CA] text-white glow-purple shadow-lg'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <CreditCard className="w-5 h-5 text-purple-300" />
            Option B: Gift Cards
          </button>
        </div>

        {/* Tab Contents */}
        {activePaymentTab === 'btc' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <BtcCheckout 
              currentUser={currentUser}
              adminBtcAddress={adminBtcAddress}
              promoCodes={promoCodes}
              onUpgradeSuccess={onUpgradeSuccess}
              onOpenAuth={onOpenAuth}
            />
          </div>
        )}
        {activePaymentTab === 'gift_card' && (
          <GiftCardForm 
            currentUser={currentUser} 
            promoCodes={promoCodes}
            onSubmitSuccess={onGiftCardSubmitted} 
            onOpenAuth={onOpenAuth} 
          />
        )}
      </div>
    </div>
  );
};
