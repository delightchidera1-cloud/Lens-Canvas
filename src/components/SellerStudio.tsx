import React, { useState } from 'react';
import { UserProfile, ProductImage } from '../types';
import { generateWatermarkedPreview } from '../utils/watermark';
import { Upload, Lock, ShieldAlert, Sparkles, CheckCircle2, Image as ImageIcon, Sliders, Eye, AlertCircle } from 'lucide-react';

interface SellerStudioProps {
  currentUser: UserProfile;
  onUploadSuccess: (product: ProductImage) => void;
  onNavigatePricing: () => void;
  onOpenAuth?: (promptMsg?: string) => void;
}

export const SellerStudio: React.FC<SellerStudioProps> = ({
  currentUser,
  onUploadSuccess,
  onNavigatePricing,
  onOpenAuth,
}) => {
  const isSeller = currentUser.isLoggedIn && currentUser.role === 'seller' && currentUser.sellerStatus === 'active_lifetime';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Digital Art');
  const [price, setPrice] = useState(150);
  const [resolution, setResolution] = useState('8192 x 5460 (44.7 MP)');
  const [format, setFormat] = useState('RAW / TIFF / PNG');
  const [license, setLicense] = useState('Standard Commercial');
  const [watermarkText, setWatermarkText] = useState('LENS & CANVAS • PREVIEW ONLY');

  // Image File & Watermark Preview State
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [watermarkedPreviewUrl, setWatermarkedPreviewUrl] = useState<string | null>(null);
  const [isGeneratingWatermark, setIsGeneratingWatermark] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categories = ['Digital Art', 'Photography', '3D Render', 'Fine Art Portrait', 'Architecture', 'Minimalism', 'Nature'];

  // Handle image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsGeneratingWatermark(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      setRawImageUrl(result);

      // Generate watermarked preview via canvas
      try {
        const watermarked = await generateWatermarkedPreview(result, watermarkText, 0.35);
        setWatermarkedPreviewUrl(watermarked);
      } catch (err) {
        setWatermarkedPreviewUrl(result);
      } finally {
        setIsGeneratingWatermark(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateWatermark = async () => {
    if (!rawImageUrl) return;
    setIsGeneratingWatermark(true);
    try {
      const watermarked = await generateWatermarkedPreview(rawImageUrl, watermarkText, 0.35);
      setWatermarkedPreviewUrl(watermarked);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsGeneratingWatermark(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !watermarkedPreviewUrl) {
      setErrorMsg('Please select an artwork file and specify a title.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/actions/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentUser.id,
          sellerEmail: currentUser.email,
          title: title.trim(),
          description: description.trim(),
          category,
          price: Number(price),
          resolution,
          format,
          license,
          watermarkedUrl: watermarkedPreviewUrl,
          originalFileBase64: rawImageUrl
        })
      });

      const data = await res.json();

      if (data.success && data.product) {
        onUploadSuccess(data.product);
      } else {
        setErrorMsg(data.error || 'Upload failed.');
      }
    } catch (err: any) {
      setErrorMsg(`Server upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // If NOT signed in or NOT verified seller, show gated access warning
  if (!isSeller) {
    if (!currentUser.isLoggedIn) {
      return (
        <div className="max-w-3xl mx-auto my-12 glass-panel border border-zinc-800 rounded-3xl p-6 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center mx-auto text-[#FF854D] glow-orange">
            <Lock className="w-8 h-8 text-[#FF6321]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Sign In Required</h2>
            <p className="text-sm text-zinc-300 max-w-lg mx-auto font-sans leading-relaxed">
              Please sign in or create an account to access the Creator Studio and upload high-resolution artworks to the Lens &amp; Canvas vault.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => onOpenAuth && onOpenAuth('Please sign in or create an account to access the Seller Studio.')}
              className="artistic-gradient-bg text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-all shadow-lg glow-orange"
            >
              Sign In or Register
            </button>

            <button
              onClick={onNavigatePricing}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm px-8 py-3.5 rounded-2xl transition-all"
            >
              View $1,500 Lifetime Membership Info
            </button>
          </div>
        </div>
      );
    }

    if (currentUser.sellerStatus === 'suspended') {
      return (
        <div className="max-w-3xl mx-auto my-12 glass-panel border border-red-500/30 rounded-3xl p-6 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 glow-orange">
            <Lock className="w-8 h-8 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">License Suspended</h2>
            <p className="text-sm text-zinc-300 max-w-lg mx-auto font-sans leading-relaxed">
              Your verified seller license has been <strong className="text-red-400">temporarily withdrawn</strong> by the administration team. You are strictly restricted from uploading new artworks to Lens &amp; Canvas until your license is restored.
            </p>
          </div>

          <div className="bg-[#121216] p-4 rounded-2xl border border-red-500/20 text-xs text-zinc-300 max-w-md mx-auto space-y-2 text-left font-sans">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Current Account Status:
            </div>
            <div className="font-mono text-red-400">
              Role: {currentUser.role} | Seller Status: {currentUser.sellerStatus}
            </div>
            <p className="text-zinc-500 text-[11px] mt-2">
              If you believe this is an error, please contact the support team.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto my-12 glass-panel border border-zinc-800 rounded-3xl p-6 sm:p-12 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center mx-auto text-[#FF854D] glow-orange">
          <Lock className="w-8 h-8 text-[#FF6321]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Verified Seller Rights Required</h2>
          <p className="text-sm text-zinc-300 max-w-lg mx-auto font-sans leading-relaxed">
            Uploading high-res artworks to Lens &amp; Canvas is strictly restricted to verified creators who have completed the <strong className="text-[#FF854D]">$1,500 Lifetime Membership deposit</strong>.
          </p>
        </div>

        <div className="bg-[#121216] p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 max-w-md mx-auto space-y-2 text-left font-sans">
          <div className="font-semibold text-zinc-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FF6321]" />
            Current Account Status:
          </div>
          <div className="font-mono text-[#FF854D]">
            Role: {currentUser.role} | Seller Status: {currentUser.sellerStatus}
          </div>
          {currentUser.role === 'pending_seller' && (
            <p className="text-amber-300 text-[11px] animate-pulse">
              ⏳ Your gift card submission is currently under review by our admin team.
            </p>
          )}
        </div>

        <button
          onClick={onNavigatePricing}
          className="artistic-gradient-bg text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-all shadow-lg glow-orange"
        >
          Upgrade to Lifetime Seller ($1,500)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4">
      
      {/* Studio Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
            Verified Lifetime Seller Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3">Secure High-Res Original Upload Pipeline</h1>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Original RAW/TIFF files are stored in our encrypted vault. Public previews are auto-watermarked instantly.
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-zinc-300 bg-[#121216] px-4 py-2.5 rounded-2xl border border-zinc-800 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>100% Royalty Retention</span>
        </div>
      </div>

      <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image File Upload & Watermark Live Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel border border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-serif font-bold text-white flex items-center justify-between">
              <span>1. Artwork Media Selection &amp; Watermarking</span>
              <span className="text-[11px] text-zinc-500 font-mono">Max 100MB</span>
            </h3>

            {/* Drag & Drop Upload Zone */}
            <div className="relative border-2 border-dashed border-zinc-800 hover:border-[#FF6321]/60 rounded-2xl p-6 text-center transition-colors bg-[#121216] group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6321]/15 border border-[#FF6321]/30 flex items-center justify-center mx-auto text-[#FF854D] group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-zinc-200">
                  Click or Drag High-Res Original Image Here
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">Supports RAW, DNG, TIFF, PNG, JPG (8K / 10K+ Supported)</p>
              </div>
            </div>

            {/* Live Watermarked Preview */}
            {watermarkedPreviewUrl && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    Auto-Watermarked Public Preview:
                  </span>
                  {isGeneratingWatermark && (
                    <span className="text-[10px] text-[#FF854D] animate-pulse font-mono">
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
                  <div className="absolute top-2 right-2 bg-[#0A0A0C]/90 backdrop-blur text-[10px] font-mono text-[#FF854D] px-2.5 py-1 rounded-md border border-zinc-800">
                    PUBLIC WATERMARKED VIEW
                  </div>
                </div>

                {/* Custom Watermark Controls */}
                <div className="space-y-2 bg-[#0A0A0C] p-3.5 rounded-2xl border border-zinc-800 font-mono">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    Watermark Text Tiling String:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-[#FF854D] focus:outline-none focus:border-[#FF6321]"
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
        </div>

        {/* Right Column: Metadata Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel border border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-serif font-bold text-white">2. Artwork Details &amp; Commercial License</h3>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                Artwork Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Celestial Nebula Spectrum No. 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6321]"
              />
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6321]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                  Price ($ USD) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#FF6321]"
                />
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                  Resolution Specs
                </label>
                <input
                  type="text"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#FF6321]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                  File Format
                </label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#FF6321]"
                />
              </div>
            </div>

            {/* Licensing */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                License Agreement Included
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6321]"
              >
                <option value="Standard Commercial">Standard Commercial (Royalty-Free)</option>
                <option value="Extended Royalty-Free">Extended Unlimited Commercial</option>
                <option value="Exclusive 1-of-1">Exclusive 1-of-1 Transfer Rights</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1 font-mono">
                Artwork Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe lighting, inspiration, medium, or camera settings..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#121216] border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Upload Button */}
            <button
              type="submit"
              disabled={isUploading || !watermarkedPreviewUrl}
              className="w-full artistic-gradient-bg text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg glow-orange transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 animate-bounce" />
                  Encrypting Original &amp; Publishing Preview...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Publish Artwork Listing to Marketplace
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
