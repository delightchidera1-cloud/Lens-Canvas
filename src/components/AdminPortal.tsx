import React, { useState, useEffect } from 'react';
import { GiftCardSubmission, BtcWebhookLog, UserProfile, PromoCode, ProductImage } from '../types';
import { Shield, Clock, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink, RefreshCw, AlertCircle, DollarSign, Award, Bitcoin, Upload, Download, Settings, Trash2, Plus } from 'lucide-react';
import { generateWatermarkedPreview } from '../utils/watermark';

interface AdminPortalProps {
  currentUser: UserProfile;
  giftCards: GiftCardSubmission[];
  btcWebhooks: BtcWebhookLog[];
  adminBtcAddress: string;
  promoCodes?: PromoCode[];
  products?: ProductImage[];
  pendingSellers?: UserProfile[];
  managedSellers?: UserProfile[];
  verifiedBtcSellersCount?: number;
  onVerifyGiftCard: (submissionId: string, action: 'approve' | 'reject', notes?: string) => void;
  onVerifySeller?: (userId: string, action: 'approve' | 'reject') => void;
  onToggleSellerStatus?: (userId: string, action: 'suspend' | 'restore') => void;
  onProductPosted?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  giftCards,
  btcWebhooks,
  adminBtcAddress,
  promoCodes = [],
  products = [],
  pendingSellers = [],
  managedSellers = [],
  verifiedBtcSellersCount = 0,
  onVerifyGiftCard,
  onVerifySeller,
  onToggleSellerStatus,
  onProductPosted,
}) => {
  const [activeTab, setActiveTab] = useState<'gift_cards' | 'btc_webhooks' | 'post_product' | 'global_settings' | 'pending_sellers' | 'managed_sellers' | 'ghost_purchases'>('gift_cards');
  
  // Settings State
  const [btcAddressInput, setBtcAddressInput] = useState(adminBtcAddress || '');
  const [promoCodesList, setPromoCodesList] = useState<PromoCode[]>(promoCodes);

  useEffect(() => {
    setBtcAddressInput(adminBtcAddress || '');
    setPromoCodesList(promoCodes);
  }, [adminBtcAddress, promoCodes]);

  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Post Product State
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postPrice, setPostPrice] = useState('150');
  const [postCat, setPostCat] = useState('Digital Art');
  const [postSeller, setPostSeller] = useState('');
  const [postImg, setPostImg] = useState('');
  const [watermarkedPreviewUrl, setWatermarkedPreviewUrl] = useState('');
  const [watermarkText, setWatermarkText] = useState('LENS & CANVAS PROOF');
  const [isGeneratingWatermark, setIsGeneratingWatermark] = useState(false);
  const [postStatus, setPostStatus] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Ghost Purchases State
  const [ghostSellerId, setGhostSellerId] = useState<string>('');
  const [ghostProductId, setGhostProductId] = useState<string>('');
  const [ghostMultiplier, setGhostMultiplier] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ghostStatus, setGhostStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // When seller changes, clear product selection
  useEffect(() => {
    setGhostProductId('');
  }, [ghostSellerId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const result = event.target.result as string;
        setPostImg(result);
        
        setIsGeneratingWatermark(true);
        try {
          const watermarked = await generateWatermarkedPreview(result, watermarkText, 0.35);
          setWatermarkedPreviewUrl(watermarked);
        } catch (err) {
          setWatermarkedPreviewUrl(result);
        } finally {
          setIsGeneratingWatermark(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateWatermark = async () => {
    if (!postImg) return;
    setIsGeneratingWatermark(true);
    try {
      const watermarked = await generateWatermarkedPreview(postImg, watermarkText, 0.35);
      setWatermarkedPreviewUrl(watermarked);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsGeneratingWatermark(false);
    }
  };

  const handleAdminPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    setPostStatus('Uploading ghost product...');
    
    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser.id,
          sellerName: postSeller,
          title: postTitle,
          description: postDesc,
          price: postPrice,
          category: postCat,
          watermarkedUrl: watermarkedPreviewUrl || postImg,
          originalFileBase64: postImg,
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setPostStatus('✅ Product uploaded successfully as: ' + (postSeller || 'Anonymous Creator'));
        setPostTitle('');
        setPostDesc('');
        setPostSeller('');
        setPostImg('');
        setWatermarkedPreviewUrl('');
        if (onProductPosted) onProductPosted();
      } else {
        setPostStatus('❌ Failed: ' + data.error);
      }
    } catch (err: any) {
      setPostStatus('❌ Error: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsStatus('Saving settings...');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminBtcAddress: btcAddressInput,
          promoCodes: promoCodesList
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsStatus('✅ Settings saved successfully. They will apply dynamically.');
        if (onProductPosted) onProductPosted(); // trigger state refresh
      } else {
        setSettingsStatus('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setSettingsStatus('❌ Error: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const savePromoCodesInstant = async (newList: PromoCode[]) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminBtcAddress: btcAddressInput,
          promoCodes: newList
        })
      });
      if (onProductPosted) onProductPosted();
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const handleAddPromoCode = () => {
    if (!newPromoCode || !newPromoDiscount) return;
    const newCode: PromoCode = {
      id: 'promo-' + Date.now(),
      code: newPromoCode,
      discount: Number(newPromoDiscount),
      isActive: true
    };
    const newList = [...promoCodesList, newCode];
    setPromoCodesList(newList);
    savePromoCodesInstant(newList);
    setNewPromoCode('');
    setNewPromoDiscount('');
  };

  const handleTogglePromoCode = (id: string) => {
    const newList = promoCodesList.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setPromoCodesList(newList);
    savePromoCodesInstant(newList);
  };

  const handleDeletePromoCode = (id: string) => {
    const newList = promoCodesList.filter(p => p.id !== id);
    setPromoCodesList(newList);
    savePromoCodesInstant(newList);
  };

  const handleSimulatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghostSellerId || !ghostProductId || ghostMultiplier < 1) return;

    setIsSimulating(true);
    setGhostStatus({ type: 'success', msg: 'Simulating purchases...' });

    try {
      const res = await fetch('/api/admin/simulate-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: ghostSellerId,
          productId: ghostProductId,
          count: ghostMultiplier
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGhostStatus({ type: 'success', msg: `✅ Successfully simulated ${ghostMultiplier} purchases!` });
        if (onProductPosted) onProductPosted();
      } else {
        setGhostStatus({ type: 'error', msg: '❌ Failed: ' + (data.error || 'Unknown error') });
      }
    } catch (err: any) {
      setGhostStatus({ type: 'error', msg: '❌ Error: ' + err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const pendingCount = giftCards.filter(g => g.status === 'pending').length;
  
  // Calculate exact revenue
  const totalGiftCardRevenue = giftCards
    .filter(g => g.status === 'approved')
    .reduce((sum, g) => sum + (g.declaredValue || 1500), 0);
    
  const totalBtcRevenue = verifiedBtcSellersCount * 1500;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4">
      
      {/* Header Stats */}
      <div className="glass-panel border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#7928CA]/20 border border-[#7928CA]/40 flex items-center justify-center text-[#E040FB] glow-purple">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">Admin Verification Vault</h1>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">Review $1,500 Gift Card submissions &amp; inspect automated BTC Webhook confirmations.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#121216] px-4 py-2.5 rounded-2xl border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Pending Review</div>
              <div className="text-lg font-bold text-[#FF854D] font-mono">{pendingCount} Submissions</div>
            </div>

            <div className="bg-[#121216] px-4 py-2.5 rounded-2xl border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Total Onboarded Revenue</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                ${(totalGiftCardRevenue + totalBtcRevenue).toLocaleString()} USD
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-3 border-t border-zinc-800/80 pt-4">
          <button
            onClick={() => setActiveTab('gift_cards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gift_cards'
                ? 'bg-[#7928CA] text-white glow-purple shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Clock className="w-4 h-4 text-purple-300" />
            Pending Gift Card Submissions ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab('btc_webhooks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'btc_webhooks'
                ? 'bg-[#FF6321] text-white glow-orange shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Bitcoin className="w-4 h-4 text-amber-300" />
            BTC Webhook Logs ({btcWebhooks.length})
          </button>

          <button
            onClick={() => setActiveTab('post_product')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'post_product'
                ? 'bg-sky-600 text-white shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Upload className="w-4 h-4 text-sky-300" />
            Post Ghost Product
          </button>

          <button
            onClick={() => setActiveTab('global_settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'global_settings'
                ? 'bg-zinc-700 text-white shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-300" />
            Global Settings
          </button>

          <button
            onClick={() => setActiveTab('ghost_purchases')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ghost_purchases'
                ? 'bg-[#E040FB] text-white shadow-md glow-purple'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-purple-300" />
            Ghost Purchases
          </button>
                   <button
            onClick={() => setActiveTab('pending_sellers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pending_sellers'
                ? 'bg-[#7928CA] text-white glow-purple shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Manual BTC Reviews ({pendingSellers.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('managed_sellers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'managed_sellers'
                ? 'bg-[#7928CA] text-white glow-purple shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Manage Sellers ({managedSellers.length})</span>
          </button>

        </div>
      </div>

      {/* Tab 1: Gift Cards Review */}
      {activeTab === 'gift_cards' && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono">
            Gift Card Verification Queue
          </h3>

          {giftCards.length === 0 ? (
            <div className="glass-panel border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 text-xs">
              No gift card submissions found in database queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {giftCards.map((gc) => (
                <div
                  key={gc.id}
                  className={`glass-card border rounded-3xl p-6 space-y-4 transition-all shadow-xl ${
                    gc.status === 'pending'
                      ? 'border-[#FF6321]/50 bg-[#0A0A0C]/90'
                      : gc.status === 'approved'
                      ? 'border-emerald-500/40'
                      : 'border-red-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-white text-base">{gc.brand} Gift Card</span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            gc.status === 'pending'
                              ? 'bg-[#FF6321]/20 text-[#FF854D] border border-[#FF6321]/40'
                              : gc.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {gc.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 font-mono">{gc.userEmail}</div>
                    </div>

                    <div className="text-right font-mono font-bold text-[#FF854D] text-lg">
                      ${gc.declaredValue} USD
                    </div>
                  </div>

                  {/* Gift Card Submission Details */}
                  <div className="bg-[#121216] p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono">

                    {gc.receiptUrl && (
                      <div className="text-[11px] text-sky-400 truncate">
                        Receipt: <a href={gc.receiptUrl} target="_blank" rel="noreferrer" className="underline">{gc.receiptUrl}</a>
                      </div>
                    )}

                    {(gc.frontImageUrl || gc.backImageUrl) && (
                      <div className="flex flex-col gap-4 mt-4">
                        {gc.frontImageUrl && (
                          <div className="bg-[#0A0A0C] p-3 rounded-xl border border-zinc-800/80">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Front Image</span>
                              <a href={gc.frontImageUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-400/10 hover:bg-sky-400/20 px-3 py-1.5 rounded-lg transition-colors border border-sky-400/20">
                                <Download className="w-3.5 h-3.5" />
                                Download Front
                              </a>
                            </div>
                            <img src={gc.frontImageUrl} alt="Card Front" className="w-full max-w-sm h-auto object-cover rounded-lg border border-zinc-700/50" />
                          </div>
                        )}
                        {gc.backImageUrl && (
                          <div className="bg-[#0A0A0C] p-3 rounded-xl border border-zinc-800/80">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Back Image</span>
                              <a href={gc.backImageUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-400/10 hover:bg-sky-400/20 px-3 py-1.5 rounded-lg transition-colors border border-sky-400/20">
                                <Download className="w-3.5 h-3.5" />
                                Download Back
                              </a>
                            </div>
                            <img src={gc.backImageUrl} alt="Card Back" className="w-full max-w-sm h-auto object-cover rounded-lg border border-zinc-700/50" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {gc.notes && (
                    <p className="text-xs text-zinc-400 bg-[#121216] p-3 rounded-xl border border-zinc-800 font-sans">
                      <strong className="text-zinc-200">User Notes:</strong> {gc.notes}
                    </p>
                  )}

                  {/* Admin Actions */}
                  {gc.status === 'pending' ? (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => onVerifyGiftCard(gc.id, 'approve', 'Approved after balance check with issuer.')}
                        className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve &amp; Grant Seller Status ($1,500)
                      </button>

                      <button
                        onClick={() => onVerifyGiftCard(gc.id, 'reject', 'Invalid PIN or balance insufficient.')}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> Submitted: {new Date(gc.submittedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: BTC Webhook Logs */}
      {activeTab === 'btc_webhooks' && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono">
            Coinbase Commerce / BTCPay Webhook Audit Logs
          </h3>

          <div className="glass-panel border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#121216] text-zinc-400 uppercase font-mono border-b border-zinc-800 text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Webhook Event</th>
                    <th className="p-3.5">User Email</th>
                    <th className="p-3.5">TX Hash</th>
                    <th className="p-3.5">BTC Amount</th>
                    <th className="p-3.5">USD Value</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {btcWebhooks.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 text-amber-300 font-bold">{log.event}</td>
                      <td className="p-3.5 text-white">{log.userEmail}</td>
                      <td className="p-3.5 text-[#FF854D] text-[11px] truncate max-w-[140px]">{log.txHash}</td>
                      <td className="p-3.5 text-amber-400">{log.amountBtc} BTC</td>
                      <td className="p-3.5 text-emerald-400 font-bold">${log.amountUsd}</td>
                      <td className="p-3.5 text-zinc-500 text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Admin Ghost Product Upload */}
      {activeTab === 'post_product' && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono">
            Upload Product as Fake Seller
          </h3>
          <div className="glass-panel border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl">
            <form onSubmit={handleAdminPost} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Seller Name (Ghost Creator)</label>
                <input 
                  required
                  value={postSeller}
                  onChange={(e) => setPostSeller(e.target.value)}
                  placeholder="e.g. PixelMaster99"
                  className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Product Title</label>
                <input 
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Neon Cyberpunk City"
                  className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Price (USD)</label>
                  <input 
                    type="number"
                    required
                    value={postPrice}
                    onChange={(e) => setPostPrice(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Category</label>
                  <input 
                    required
                    value={postCat}
                    onChange={(e) => setPostCat(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Description</label>
                <textarea 
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors h-24 resize-none" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Artwork Image</label>
                <div className="relative border-2 border-dashed border-zinc-800 hover:border-sky-500/60 rounded-xl p-4 text-center transition-colors bg-[#121216]">
                  <input
                    type="file"
                    accept="image/*"
                    required={!postImg}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-200">
                      Click or Drag Artwork Image Here
                    </div>
                  </div>
                </div>
                {watermarkedPreviewUrl && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                        <Eye className="w-4 h-4 text-sky-400" />
                        Auto-Watermarked Public Preview:
                      </span>
                      {isGeneratingWatermark && (
                        <span className="text-[10px] text-sky-400 animate-pulse font-mono">
                          Generating Watermark...
                        </span>
                      )}
                    </div>
    
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-800 aspect-video bg-black flex items-center justify-center shadow-lg">
                      <img
                        src={watermarkedPreviewUrl}
                        alt="Public Watermarked Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-[#0A0A0C]/90 backdrop-blur text-[10px] font-mono text-sky-400 px-2.5 py-1 rounded-md border border-zinc-800">
                        PUBLIC WATERMARKED VIEW
                      </div>
                    </div>
    
                    <div className="space-y-2 bg-[#0A0A0C] p-3.5 rounded-2xl border border-zinc-800 font-mono">
                      <label className="text-[11px] font-semibold text-zinc-400 block">
                        Watermark Text Tiling String:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-sky-400 focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={handleUpdateWatermark}
                          className="bg-zinc-800 hover:bg-zinc-700 text-xs px-3.5 py-1.5 rounded-xl text-zinc-200 shrink-0 font-sans font-medium"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isPosting}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPosting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {isPosting ? 'Uploading...' : 'Publish Ghost Product'}
              </button>

              {postStatus && (
                <div className="text-center text-sm font-mono mt-4 text-zinc-300">
                  {postStatus}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Global Settings */}
      {activeTab === 'global_settings' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono text-center">
            Global Application Settings
          </h3>

          <div className="glass-card border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-700/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
            
            <form onSubmit={handleSaveSettings} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300 font-mono">
                  Global Bitcoin Wallet Address (Admin)
                </label>
                <div className="text-xs text-zinc-500 mb-2 font-sans">
                  This address will be displayed on the checkout page for all users to deposit Bitcoin.
                </div>
                <input
                  type="text"
                  required
                  value={btcAddressInput}
                  onChange={(e) => setBtcAddressInput(e.target.value)}
                  placeholder="bc1q..."
                  className="w-full bg-[#0A0A0C]/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-amber-500 font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800/80">
                <h4 className="text-sm font-semibold text-[#FF854D] mb-4">Promo Code Activator</h4>
                
                {/* List of existing promo codes */}
                {promoCodesList.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {promoCodesList.map((promo) => (
                      <div key={promo.id} className={`flex items-center justify-between p-3 rounded-xl border ${promo.isActive ? 'bg-[#FF6321]/10 border-[#FF6321]/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
                        <div>
                          <div className="font-mono font-bold text-sm text-white">{promo.code}</div>
                          <div className="text-xs text-zinc-400">{promo.discount}% Off</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePromoCode(promo.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${promo.isActive ? 'bg-[#FF6321] text-white hover:bg-[#FF854D]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                          >
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePromoCode(promo.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 bg-[#0A0A0C] p-4 rounded-xl border border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono mb-2">Create New Promo</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-zinc-300 font-mono">
                        Promo Code
                      </label>
                      <input
                        type="text"
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value)}
                        placeholder="e.g. HOLIDAY50"
                        className="w-full bg-[#121216] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#FF6321] transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-zinc-300 font-mono">
                        Discount %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newPromoDiscount}
                          onChange={(e) => setNewPromoDiscount(e.target.value)}
                          placeholder="50"
                          className="w-full bg-[#121216] border border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#FF6321] transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPromoCode}
                    disabled={!newPromoCode || !newPromoDiscount}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Promo Code
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSavingSettings}
                className="w-full bg-zinc-200 hover:bg-white text-zinc-900 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingSettings ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>

              {settingsStatus && (
                <div className="text-center text-sm font-mono mt-4 text-zinc-300">
                  {settingsStatus}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Pending Sellers */}
      {activeTab === 'pending_sellers' && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono">
            Pending Sellers (BTC/Manual)
          </h3>

          {pendingSellers.length === 0 ? (
            <div className="glass-panel border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 text-xs">
              No pending sellers awaiting verification.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-lg relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-50 text-amber-500">
                    <Clock className="w-16 h-16" strokeWidth={0.5} />
                  </div>

                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white tracking-wide">
                          User ID: <span className="font-mono text-zinc-400">{seller.id.slice(0,8)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#09090b] rounded-lg p-3 border border-zinc-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Email:</span>
                        <span className="font-mono text-white">{seller.email}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Declared Payment Method:</span>
                        <span className="font-mono text-[#FF854D] uppercase">{seller.paymentMethod || 'BTC'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-800/50 relative z-10">
                    <button
                      onClick={() => onVerifySeller && onVerifySeller(seller.id, 'approve')}
                      className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve License
                    </button>
                    <button
                      onClick={() => onVerifySeller && onVerifySeller(seller.id, 'reject')}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Managed Sellers Tab */}
      {activeTab === 'managed_sellers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#E040FB]" />
              Manage Verified Sellers
            </h3>
            <span className="text-sm text-zinc-400">Total: {managedSellers.length}</span>
          </div>

          {managedSellers.length === 0 ? (
            <div className="text-center py-12 glass-panel border border-zinc-800/80 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-sans">No verified sellers in the system.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {managedSellers.map((seller) => (
                <div key={seller.id} className="glass-panel border border-zinc-800/80 rounded-2xl p-5 hover:border-[#7928CA]/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{seller.email}</span>
                        {seller.sellerStatus === 'suspended' ? (
                          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                            Active Lifetime
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">
                        Method: <span className="uppercase text-amber-300">{seller.paymentMethod || 'Unknown'}</span> | 
                        Verified: {seller.upgradedAt ? new Date(seller.upgradedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {seller.sellerStatus === 'suspended' ? (
                        <button
                          onClick={() => onToggleSellerStatus && onToggleSellerStatus(seller.id, 'restore')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors border border-emerald-500/30"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Restore License
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleSellerStatus && onToggleSellerStatus(seller.id, 'suspend')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors border border-red-500/30"
                        >
                          <XCircle className="w-4 h-4" />
                          Suspend License
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ghost Purchases Tab */}
      {activeTab === 'ghost_purchases' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E040FB]" />
              Ghost Purchases
            </h3>
            <span className="text-sm text-zinc-400">Simulate Sales</span>
          </div>

          <div className="glass-panel border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">1. Select Target Seller</label>
                <select
                  value={ghostSellerId}
                  onChange={(e) => setGhostSellerId(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7928CA] transition-colors appearance-none"
                >
                  <option value="">-- Choose a verified seller --</option>
                  {managedSellers.filter(s => s.sellerStatus !== 'suspended').map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.email} (Balance: ${(seller.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">2. Select Product</label>
                <select
                  value={ghostProductId}
                  onChange={(e) => setGhostProductId(e.target.value)}
                  disabled={!ghostSellerId}
                  className="w-full bg-[#0A0A0C] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7928CA] transition-colors appearance-none disabled:opacity-50"
                >
                  <option value="">-- Choose a product --</option>
                  {products.filter(p => p.sellerId === ghostSellerId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (${p.price})
                    </option>
                  ))}
                </select>
                {ghostSellerId && products.filter(p => p.sellerId === ghostSellerId).length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">This seller has no products.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/50 space-y-4">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">3. Sales Multiplier</label>
              <div className="flex flex-wrap gap-3">
                {[1, 5, 10, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGhostMultiplier(num)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all border ${
                      ghostMultiplier === num
                        ? 'bg-[#E040FB]/20 border-[#E040FB]/50 text-[#E040FB] shadow-[0_0_15px_rgba(224,64,251,0.2)]'
                        : 'bg-[#121216] border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                Simulating {ghostMultiplier} sale(s). The seller's balance will increase by {(products.find(p => p.id === ghostProductId)?.price || 0) * ghostMultiplier} USD.
              </p>
            </div>

            {ghostStatus && (
              <div className={`p-4 rounded-xl text-sm font-mono flex items-center gap-2 ${
                ghostStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {ghostStatus.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                {ghostStatus.msg}
              </div>
            )}

            <button
              onClick={handleSimulatePurchase}
              disabled={isSimulating || !ghostSellerId || !ghostProductId}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-[#7928CA] to-[#FF0080] hover:from-[#FF0080] hover:to-[#7928CA] text-white shadow-[0_0_20px_rgba(224,64,251,0.3)]"
            >
              {isSimulating ? 'Processing...' : `Inject ${ghostMultiplier} Sale(s)`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
