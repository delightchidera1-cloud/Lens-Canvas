import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Camera, Sparkles, Upload, Shield, Code, ShoppingBag, Bitcoin, CreditCard, CheckCircle2, LogIn, LogOut, User, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  activeTab: 'marketplace' | 'pricing' | 'upload' | 'admin' | 'auth' | 'my-products';
  onNavigate: (tab: 'marketplace' | 'pricing' | 'upload' | 'admin' | 'auth' | 'my-products') => void;
  pendingCount: number;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  pendingCount,
  onSignOut,
  onOpenAuth,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (tab: any) => {
    onNavigate(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-zinc-800/80 sticky top-[37px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl artistic-gradient-bg p-0.5 flex items-center justify-center glow-orange group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0A0A0C] rounded-[10px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#FF6321] group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xl text-white tracking-tight">Lens &amp; Canvas</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-serif-italic hidden sm:block">Fine Art &amp; Photography Vault</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {currentUser.role !== 'admin' && (
              <>
                <button
                  onClick={() => handleNav('marketplace')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'marketplace'
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span>Marketplace</span>
                </button>

                {(!currentUser.isLoggedIn || (currentUser.role !== 'seller' && currentUser.role !== 'admin')) && (
                  <button
                    onClick={() => handleNav('pricing')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                      activeTab === 'pricing'
                        ? 'bg-[#FF6321] text-white font-bold glow-orange'
                        : 'text-[#FF854D] hover:bg-[#FF6321]/10 border border-[#FF6321]/30'
                    }`}
                  >
                    <span>Become Seller</span>
                  </button>
                )}

                <button
                  onClick={() => handleNav('upload')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'upload'
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Seller Studio</span>
                  {(!currentUser.isLoggedIn || currentUser.role !== 'seller') && (
                    <span className="text-[10px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">Gated</span>
                  )}
                </button>

                {currentUser.isLoggedIn && currentUser.role === 'seller' && (
                  <button
                    onClick={() => handleNav('my-products')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'my-products'
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#FF6321]" />
                    <span>My Products</span>
                  </button>
                )}
              </>
            )}

            {currentUser.isLoggedIn && currentUser.role === 'admin' && (
              <button
                onClick={() => handleNav('admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  activeTab === 'admin'
                    ? 'bg-[#7928CA]/40 text-purple-200 border border-[#7928CA]/60 glow-purple'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                }`}
              >
                <Shield className="w-4 h-4 text-[#E040FB]" />
                <span>Admin</span>
                {pendingCount > 0 && (
                  <span className="bg-[#FF6321] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth / User Section */}
            {currentUser.isLoggedIn ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 ml-1">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-[11px] font-medium text-white truncate max-w-[120px]">
                    {currentUser.fullName || currentUser.email.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={() => { onSignOut(); setIsMobileMenuOpen(false); }}
                  title="Sign Out"
                  className="bg-zinc-900 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-zinc-800 hover:border-red-500/30 p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('auth')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ml-1 ${
                  activeTab === 'auth'
                    ? 'bg-[#FF6321] text-white glow-orange'
                    : 'bg-[#121216] text-[#FF854D] hover:bg-[#FF6321]/15 border border-[#FF6321]/40'
                }`}
              >
                <LogIn className="w-4 h-4 text-[#FF6321]" />
                <span>Sign In / Register</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0C] border-t border-zinc-800/80 px-4 py-4 space-y-2">
          {currentUser.role !== 'admin' && (
            <>
              <button
                onClick={() => handleNav('marketplace')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'marketplace'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-sky-400" />
                Marketplace
              </button>
              
              {(!currentUser.isLoggedIn || (currentUser.role !== 'seller' && currentUser.role !== 'admin')) && (
                <button
                  onClick={() => handleNav('pricing')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'pricing'
                      ? 'bg-[#FF6321] text-white'
                      : 'text-[#FF854D] border border-[#FF6321]/30'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  Become Seller
                </button>
              )}

              <button
                onClick={() => handleNav('upload')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Seller Studio
                </div>
                {(!currentUser.isLoggedIn || currentUser.role !== 'seller') && (
                  <span className="text-[10px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">Gated</span>
                )}
              </button>

              {currentUser.isLoggedIn && currentUser.role === 'seller' && (
                <button
                  onClick={() => handleNav('my-products')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'my-products'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400'
                  }`}
                >
                  <User className="w-5 h-5 text-[#FF6321]" />
                  My Products
                </button>
              )}
            </>
          )}

          {currentUser.isLoggedIn && currentUser.role === 'admin' && (
            <button
              onClick={() => handleNav('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#7928CA]/40 text-purple-200 border border-[#7928CA]/60'
                  : 'text-zinc-400'
              }`}
            >
              <Shield className="w-5 h-5 text-[#E040FB]" />
              Admin
              {pendingCount > 0 && (
                <span className="bg-[#FF6321] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ml-auto">
                  {pendingCount} Pending
                </span>
              )}
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-zinc-800">
            {currentUser.isLoggedIn ? (
              <button
                onClick={() => { onSignOut(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-zinc-800 hover:border-red-500/30 p-3 rounded-xl text-sm font-semibold transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => handleNav('auth')}
                className="w-full flex items-center justify-center gap-2 bg-[#FF6321] text-white p-3 rounded-xl text-sm font-bold glow-orange transition-all"
              >
                <LogIn className="w-5 h-5" />
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
