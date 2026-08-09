import React, { useState } from 'react';
import { ProductImage, UserProfile } from '../types';
import { Trash2, AlertCircle, ShieldCheck, Image as ImageIcon, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { WithdrawModal } from './WithdrawModal';

interface MyProductsProps {
  products: ProductImage[];
  currentUser: UserProfile;
  onDeleteSuccess: () => void;
}

export const MyProducts: React.FC<MyProductsProps> = ({ products, currentUser, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const myProducts = products.filter(p => p.sellerId === currentUser.id);

  const handleDelete = async (product: ProductImage) => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(product.id);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/actions/products/${product.id}?sellerId=${currentUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        onDeleteSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to delete product.');
      }
    } catch (err: any) {
      setErrorMsg(`Server error: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
            Creator Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3">My Products &amp; Earnings</h1>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Manage your listed artworks and track your lifetime revenue.
          </p>
        </div>

        {/* Financial Overview */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="flex gap-4">
            <div className="bg-[#121216] border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center min-w-[160px]">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold font-mono uppercase tracking-wider">Total Balance</span>
              </div>
              <div className="text-3xl font-serif font-bold text-white">
                ${(currentUser.balance || 0).toLocaleString()}
              </div>
            </div>
            
            <div className="bg-[#121216] border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center min-w-[160px] hidden sm:flex">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <TrendingUp className="w-4 h-4 text-[#FF854D]" />
                <span className="text-xs font-semibold font-mono uppercase tracking-wider">Total Sales</span>
              </div>
              <div className="text-3xl font-serif font-bold text-white">
                {myProducts.reduce((sum, p) => sum + p.salesCount, 0)}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 px-6 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 h-full min-h-[92px]"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Withdraw Funds</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-300 flex items-center gap-2 font-mono">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {myProducts.length === 0 ? (
        <div className="glass-panel border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">You haven't listed any artworks yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myProducts.map((p) => (
            <div
              key={p.id}
              className="group glass-card border border-zinc-800/80 hover:border-[#FF6321]/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-lg"
            >
              <div className="relative aspect-[4/3] bg-[#0A0A0C] overflow-hidden">
                <img
                  src={p.watermarkedUrl}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                <div className="absolute top-3 left-3 bg-[#0A0A0C]/85 backdrop-blur text-[10px] font-mono text-[#FF854D] px-2.5 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3 h-3 text-[#FF6321]" />
                  Preview
                </div>

                <div className="absolute top-3 right-3 bg-[#0A0A0C]/85 backdrop-blur text-[10px] font-mono text-emerald-400 px-2.5 py-1 rounded-md border border-zinc-800 font-bold shadow-md">
                  ${p.price} USD
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                    <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">{p.category}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{p.resolution}</span>
                  </div>

                  <h3 className="font-serif font-bold text-white text-lg line-clamp-1">
                    {p.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                    <span>Sales: <strong className="text-emerald-400">{p.salesCount}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(p)}
                  disabled={isDeleting === p.id}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting === p.id ? 'Deleting...' : 'Delete Product'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isWithdrawModalOpen && (
        <WithdrawModal
          currentUser={currentUser}
          onClose={() => setIsWithdrawModalOpen(false)}
        />
      )}
    </div>
  );
};
