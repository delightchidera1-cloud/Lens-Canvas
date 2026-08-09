import React, { useState, useEffect } from 'react';
import { ProductImage, UserProfile } from '../types';
import { Search, Filter, ShoppingBag, Eye, Award, CheckCircle2, ShieldCheck, Download, ArrowUpRight, Sparkles } from 'lucide-react';

interface MarketplaceFeedProps {
  products: ProductImage[];
  currentUser: UserProfile;
  onSelectProduct: (product: ProductImage) => void;
  onNavigatePricing: () => void;
}

export const MarketplaceFeed: React.FC<MarketplaceFeedProps> = ({
  products,
  currentUser,
  onSelectProduct,
  onNavigatePricing,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Digital Art', 'Photography', '3D Render', 'Minimalism', 'Architecture'];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayLimit = isMobile ? 4 : 8;
  const displayedProducts = filteredProducts.slice(0, displayLimit);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4">
      
      {/* Marketplace Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121218] via-[#0A0A0C] to-[#181220] border border-zinc-800/80 p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF854D] text-xs font-semibold tracking-wide">
            <Award className="w-3.5 h-3.5 text-[#FF6321]" />
            Verified Lifetime Sellers Only
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white tracking-tight leading-tight">
            Curated Fine Art &amp; <span className="artistic-gradient-text font-serif-italic">Masterwork</span> Photography
          </h1>

          <p className="text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl font-sans">
            Browse unthrottled high-resolution masterworks uploaded directly by verified lifetime creators ($1,500 deposit). Watermarked for public preview, delivered with cryptographic time-limited signed download tokens upon purchase.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-5 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Artist Royalty Model
            </span>
            <span className="flex items-center gap-1.5 text-[#FF854D]">
              <ShieldCheck className="w-4 h-4 text-[#FF6321]" /> BTC &amp; Gift Card Verified Vault
            </span>
          </div>
        </div>

        {/* Decorative artistic background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FF6321]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#7928CA]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-zinc-800">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#FF6321] text-white shadow-md glow-orange'
                  : 'bg-[#121216] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search titles or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6321] transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Product Grid */}
      {displayedProducts.length === 0 ? (
        <div className="glass-panel border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-zinc-400 text-sm">No artwork listings match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((p) => (
            <div
              key={p.id}
              className="group glass-card border border-zinc-800/80 hover:border-[#FF6321]/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF6321]/10"
            >
              {/* Image Preview Container with Watermark Overlay badge */}
              <div className="relative aspect-[4/3] bg-[#0A0A0C] overflow-hidden cursor-pointer" onClick={() => onSelectProduct(p)}>
                <img
                  src={p.watermarkedUrl}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                

                
                {/* Watermarked Badge */}
                <div className="absolute top-3 left-3 bg-[#0A0A0C]/85 backdrop-blur text-[10px] font-mono text-[#FF854D] px-2.5 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3 h-3 text-[#FF6321]" />
                  Watermarked Preview
                </div>

                <div className="absolute top-3 right-3 bg-[#0A0A0C]/85 backdrop-blur text-[10px] font-mono text-emerald-400 px-2.5 py-1 rounded-md border border-zinc-800 font-bold shadow-md">
                  ${p.price} USD
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                    <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">{p.category}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{p.resolution}</span>
                  </div>

                  <h3 className="font-serif font-bold text-white text-lg group-hover:text-[#FF854D] transition-colors line-clamp-1">
                    {p.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-[#FF6321] animate-pulse" />
                    <span>By <strong className="text-zinc-200">{p.sellerName}</strong></span>
                    <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-800 font-mono ml-auto">
                      Lifetime Seller
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectProduct(p)}
                  className="w-full bg-[#121216] hover:bg-[#FF6321] text-zinc-200 hover:text-white font-bold text-xs py-2.5 rounded-xl border border-zinc-800 hover:border-[#FF6321] flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md hover:glow-orange"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Inspect &amp; Purchase (${p.price})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
