import React, { useState } from 'react';
import { ProductImage, UserProfile, Transaction } from '../types';
import { X, ShoppingBag, Download, ShieldCheck, CheckCircle2, Lock, Clock, CreditCard, AlertCircle } from 'lucide-react';

interface PurchaseModalProps {
  product: ProductImage | null;
  currentUser: UserProfile;
  onClose: () => void;
  onPurchaseComplete: (tx: Transaction, downloadUrl: string) => void;
  onOpenAuth?: (promptMsg?: string) => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  product,
  currentUser,
  onClose,
  onPurchaseComplete,
  onOpenAuth,
}) => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{
    tx: Transaction;
    downloadUrl: string;
    expiresAt: string;
  } | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  if (!product) return null;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    if (formatted.length <= 19) setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (value.length <= 5) setExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setCvv(value);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors = [];
    if (cardNumber.replace(/\s/g, '').length < 15) newErrors.push('Valid card number required');
    if (expiry.length < 5) newErrors.push('Valid expiration date required (MM/YY)');
    if (cvv.length < 3) newErrors.push('Valid CVV required');
    if (!cardName.trim()) newErrors.push('Name on card is required');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    setIsPurchasing(true);

    try {
      const res = await fetch('/api/actions/purchase-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerEmail: currentUser.email,
          productId: product.id,
          paymentMethod: 'Credit Card',
          // We intentionally drop raw card numbers here for PCI compliance, simulated checkout
          cardLast4: cardNumber.slice(-4)
        })
      });

      const data = await res.json();

      if (data.success) {
        setPurchaseResult({
          tx: data.transaction,
          downloadUrl: data.downloadUrl,
          expiresAt: data.expiresAt
        });
        onPurchaseComplete(data.transaction, data.downloadUrl);
      } else {
        setErrors([data.error || 'Payment failed. Please try again.']);
      }
    } catch (err: any) {
      console.error(err);
      setErrors([err.message || 'Payment failed due to a network error.']);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 space-y-6 relative shadow-2xl">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-[#121216] p-2.5 rounded-2xl border border-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {purchaseResult ? (
          /* SUCCESS VIEW - Download Issued */
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Purchase Confirmed!</h2>
              <p className="text-sm text-zinc-300 font-sans">
                You have acquired the unwatermarked original high-resolution file for <strong className="text-white">{product.title}</strong>.
              </p>
            </div>

            {/* Signed Token Box */}
            <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 text-left space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span>Signed Download Token:</span>
                <span className="text-emerald-400 font-bold">{purchaseResult.tx.downloadToken}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Link Expiration:</span>
                <span className="text-[#FF854D]">24 Hours ({new Date(purchaseResult.expiresAt).toLocaleTimeString()})</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={purchaseResult.downloadUrl}
                download
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download Original Unwatermarked Image (JPG/TIFF)
              </a>

              <button
                onClick={onClose}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm py-3.5 px-6 rounded-2xl font-semibold"
              >
                Back to Feed
              </button>
            </div>
          </div>
        ) : (
          /* PRE-PURCHASE VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Watermarked Preview */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-[#121216] border border-zinc-800 aspect-square shadow-lg">
                <img
                  src={product.watermarkedUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                

                <div className="absolute top-2 left-2 bg-[#0A0A0C]/90 backdrop-blur text-[10px] font-mono text-[#FF854D] px-2.5 py-1 rounded-md border border-zinc-800">
                  WATERMARKED PUBLIC PREVIEW
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono text-center">
                Watermarks are automatically removed on high-resolution download file.
              </p>
            </div>

            {/* Right: Technical Details & Buy Button */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-[#FF854D] font-mono uppercase tracking-widest font-semibold mb-1">
                    {product.category}
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">{product.title}</h2>
                  <div className="text-xs text-zinc-400 mt-1 font-sans">
                    Created by <strong className="text-zinc-200">{product.sellerName}</strong> (Verified $1,500 Lifetime Member)
                  </div>
                </div>

                {/* Specs Box */}
                <div className="bg-[#121216] p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Resolution:</span>
                    <span>{product.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Format:</span>
                    <span>{product.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">License:</span>
                    <span className="text-emerald-400 font-bold">{product.license}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {product.description}
                </p>
              </div>

              {/* Price & Buy Action */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 uppercase tracking-widest font-mono font-semibold">Total Price</span>
                  <span className="text-3xl font-serif font-black text-emerald-400 font-mono">${product.price} USD</span>
                </div>

                {!currentUser.isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-[#FF6321]/15 border border-[#FF6321]/30 rounded-2xl text-xs text-[#FF854D] flex items-center gap-2 font-mono">
                      <Lock className="w-4 h-4 shrink-0 text-[#FF6321]" />
                      <span>Sign in required to complete original artwork purchase</span>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenAuth) {
                          onOpenAuth(`Please sign in or create an account to purchase "${product.title}" ($${product.price}).`);
                        }
                      }}
                      className="w-full artistic-gradient-bg text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg glow-orange"
                    >
                      <Lock className="w-4 h-4" />
                      Sign In / Register to Purchase
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePurchase} className="space-y-4">
                    <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-inner">
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 uppercase tracking-widest border-b border-zinc-800 pb-2">
                        <CreditCard className="w-4 h-4 text-[#E040FB]" />
                        Secure Card Checkout
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">Card Number</label>
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E040FB] font-mono transition-colors placeholder:text-zinc-700"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={handleExpiryChange}
                              className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E040FB] font-mono transition-colors placeholder:text-zinc-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">CVV / CVC</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={cvv}
                              onChange={handleCvvChange}
                              className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E040FB] font-mono transition-colors placeholder:text-zinc-700"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">Name on Card</label>
                          <input
                            type="text"
                            placeholder="JOHN DOE"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E040FB] font-mono transition-colors placeholder:text-zinc-700"
                            required
                          />
                        </div>
                      </div>
                      
                      {errors.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-mono space-y-1">
                          {errors.map((err, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isPurchasing}
                      className="w-full bg-gradient-to-r from-[#7928CA] to-[#FF0080] hover:from-[#FF0080] hover:to-[#7928CA] text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(224,64,251,0.3)] disabled:opacity-50"
                    >
                      {isPurchasing ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Processing Secure Payment...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Pay ${product.price} &amp; Download Original
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-2">
                      <Lock className="w-3 h-3" />
                      <span>256-bit Secure Encrypted Checkout (PCI-DSS Compliant)</span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
