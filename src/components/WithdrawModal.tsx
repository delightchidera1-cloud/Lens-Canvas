import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Lock, CheckCircle2, Building, ShieldCheck, Globe, CreditCard } from 'lucide-react';

interface WithdrawModalProps {
  currentUser: UserProfile;
  onClose: () => void;
}

const REGIONS = [
  { id: 'US', name: 'United States', methods: ['ACH Transfer', 'Wire Transfer', 'CashApp', 'Zelle', 'PayPal'] },
  { id: 'UK', name: 'United Kingdom', methods: ['BACS', 'CHAPS', 'PayPal', 'Revolut'] },
  { id: 'CA', name: 'Canada', methods: ['Interac e-Transfer', 'Wire Transfer', 'PayPal'] },
  { id: 'AU', name: 'Australia', methods: ['PayID', 'Bank Transfer', 'PayPal'] },
  { id: 'NZ', name: 'New Zealand', methods: ['Bank Transfer', 'PayPal'] },
  { id: 'MX', name: 'Mexico', methods: ['SPEI', 'PayPal'] },
  { id: 'BR', name: 'Brazil', methods: ['PIX', 'Bank Transfer'] },
  { id: 'ES', name: 'Spain (EU)', methods: ['SEPA Transfer', 'PayPal'] },
];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ currentUser, onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [selectedMethod, setSelectedMethod] = useState(REGIONS[0].methods[0]);
  const [accountDetails, setAccountDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const balance = currentUser.balance || 0;
  const WITHDRAWAL_LIMIT = 3500;
  const progressPercent = Math.min((balance / WITHDRAWAL_LIMIT) * 100, 100);
  const isLocked = balance < WITHDRAWAL_LIMIT;

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = REGIONS.find(r => r.id === e.target.value) || REGIONS[0];
    setSelectedRegion(region);
    setSelectedMethod(region.methods[0]);
    setAccountDetails('');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !accountDetails) return;

    setIsSubmitting(true);
    // Mocking an API call delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#7928CA]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-4 sm:p-8 space-y-8 relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Withdraw Funds</h2>
              <p className="text-sm text-zinc-400 mt-1">Cash out your lifetime creator earnings.</p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white bg-[#121216] p-2.5 rounded-2xl border border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-white">Withdrawal Initiated</h3>
                <p className="text-sm text-zinc-300">
                  ${balance.toLocaleString()} is being transferred via {selectedMethod}.
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-2">
                  Depending on your region ({selectedRegion.name}), funds will arrive in 1-3 business days.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-6">
              
              {/* Balance & Progress */}
              <div className="bg-[#121216] border border-zinc-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider mb-1">Available Balance</div>
                    <div className="text-3xl font-serif font-bold text-white">${balance.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">Limit</div>
                    <div className="text-sm font-semibold text-zinc-300">${WITHDRAWAL_LIMIT.toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isLocked ? 'bg-[#FF6321]' : 'bg-emerald-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {isLocked ? (
                    <p className="text-xs text-[#FF6321] flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      You need ${(WITHDRAWAL_LIMIT - balance).toLocaleString()} more to unlock withdrawals.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Withdrawal threshold met. You're ready to cash out!
                    </p>
                  )}
                </div>
              </div>

              {/* Regional Gateway Selection */}
              <div className={`space-y-4 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" /> Country / Region
                  </label>
                  <select
                    value={selectedRegion.id}
                    onChange={handleRegionChange}
                    className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {REGIONS.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-400" /> Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRegion.methods.map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedMethod(method)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          selectedMethod === method
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> Account Details
                  </label>
                  <input
                    type="text"
                    required
                    value={accountDetails}
                    onChange={e => setAccountDetails(e.target.value)}
                    placeholder={`Enter your ${selectedMethod} details...`}
                    className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isSubmitting || !accountDetails}
                className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              >
                {isSubmitting ? 'Processing...' : isLocked ? 'Limit Not Reached' : `Withdraw $${balance.toLocaleString()}`}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
                <span>Secured by 256-bit encryption &amp; KYC Verification</span>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
