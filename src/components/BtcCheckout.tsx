import React, { useState, useEffect } from 'react';
import { UserProfile, BtcWebhookLog, PromoCode } from '../types';
import { Bitcoin, CheckCircle2, Copy, RefreshCw, QrCode, ShieldCheck, Zap, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';

interface BtcCheckoutProps {
  currentUser: UserProfile;
  adminBtcAddress: string;
  promoCodes?: PromoCode[];
  onUpgradeSuccess: (txHash: string) => void;
  onOpenAuth?: (promptMsg?: string) => void;
}

export const BtcCheckout: React.FC<BtcCheckoutProps> = ({ currentUser, adminBtcAddress, promoCodes = [], onUpgradeSuccess, onOpenAuth }) => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputPromoCode, setInputPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Constants
  const btcAddress = adminBtcAddress || "bc1q9v8k7m3p2w0x9z8y7x6w5v4u3t2s1r0q9p8o7n";
  const baseUsdPrice = 1500;
  
  const discountAmount = appliedPromo ? (baseUsdPrice * appliedPromo.discount) / 100 : 0;
  const usdPrice = baseUsdPrice - discountAmount;
  
  const btcRate = 65000;
  const btcAmount = (usdPrice / btcRate).toFixed(8);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(btcAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualConfirm = async () => {
    if (!currentUser.isLoggedIn) {
      if (onOpenAuth) onOpenAuth("Please sign in to confirm your payment.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/actions/btc-confirm-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onUpgradeSuccess('manual_pending');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    const activeCodes = promoCodes.filter(p => p.isActive);
    const match = activeCodes.find(p => p.code.toLowerCase() === inputPromoCode.trim().toLowerCase());
    if (match) {
      setAppliedPromo(match);
    } else {
      setAppliedPromo(null);
      setPromoError('Invalid or inactive promo code.');
    }
  };

  const hasActivePromos = promoCodes.some(p => p.isActive);

  return (
    <div className="glass-panel border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center glow-orange">
            <Bitcoin className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              Pay via Bitcoin (BTC)
            </h3>
            <p className="text-sm text-zinc-400 font-sans">Instant lifetime seller upgrade upon 1 network confirmation.</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Amount Due</div>
          <div className="text-2xl font-black text-[#FF854D] font-mono">
            {appliedPromo ? (
              <>
                <span className="line-through text-zinc-600 text-lg mr-2">${baseUsdPrice.toLocaleString()}</span>
                ${usdPrice.toLocaleString()} USD
              </>
            ) : (
              `$${usdPrice.toLocaleString()} USD`
            )}
          </div>
          {appliedPromo && <div className="text-xs text-emerald-400 font-mono mt-1">Promo code applied! ({appliedPromo.discount}% off)</div>}
        </div>
      </div>

      {/* Promo Code Section */}
      {hasActivePromos && !appliedPromo && (
        <div className="bg-[#121216] border border-[#FF6321]/30 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-400 mb-1 font-mono">Have a Promo Code?</label>
              <input 
                type="text" 
                value={inputPromoCode}
                onChange={(e) => { setInputPromoCode(e.target.value); setPromoError(null); }}
                placeholder="Enter code here"
                className="w-full bg-[#0A0A0C] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6321]"
              />
            </div>
            <button 
              onClick={handleApplyPromo}
              className="mt-5 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Apply
            </button>
          </div>
          {promoError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{promoError}</span>
            </div>
          )}
        </div>
      )}

      {/* Payment Instructions & QR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#070709] p-6 rounded-2xl border border-zinc-800">
        
        {/* Mock QR Code */}
        <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-white rounded-2xl shadow-xl text-zinc-900">
          <div className="w-36 h-36 bg-[#0A0A0C] rounded-xl p-2 flex flex-col items-center justify-center text-center text-white space-y-1 relative">
            <QrCode className="w-24 h-24 text-[#FF6321]" />
            <span className="text-[10px] font-mono text-zinc-400">bitcoin:{btcAddress}</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider font-mono">Scan in BTC Wallet</span>
        </div>

        {/* Address Details */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5 font-mono">
              Deposit Bitcoin Address (Native SegWit / Bech32)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={btcAddress}
                className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#FF854D] focus:outline-none"
              />
              <button
                onClick={handleCopyAddress}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-emerald-400 font-medium font-mono">
              <Zap className="w-4 h-4 shrink-0" />
              <span>BTCPay Server / Coinbase Commerce Webhook Listener Active</span>
            </div>
            <p className="leading-relaxed">
              Once your payment is broadcast to the Mempool, our automated webhook listener at <code className="text-[#FF854D] bg-[#121216] px-1.5 py-0.5 rounded border border-zinc-800">app/api/webhooks/crypto/route.ts</code> will detect the transaction and grant your account <strong className="text-white">Active Lifetime Seller</strong> status.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/80">
            <button
              onClick={handleManualConfirm}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  I have made payment successfully
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-zinc-500 mt-2 font-mono uppercase tracking-wider">
              Click after sending to notify our admin team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
