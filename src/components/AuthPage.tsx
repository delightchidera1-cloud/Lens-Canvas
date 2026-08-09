import React, { useState } from 'react';
import { UserProfile } from '../types';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Award, Check } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  promptMessage?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, promptMessage }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [roleChoice, setRoleChoice] = useState<'buyer' | 'seller'>('buyer');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(`Login error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signupEmail.trim() || !signupPassword.trim() || !signupName.trim()) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword.trim(),
          roleChoice,
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMsg(`Sign up error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Shortcut
  const handleDemoLogin = (role: 'buyer' | 'seller' | 'admin') => {
    let demoUser: UserProfile;
    if (role === 'buyer') {
      demoUser = {
        id: 'user-buyer-101',
        email: 'creator@example.com',
        fullName: 'Collector Demo',
        role: 'buyer',
        sellerStatus: 'none',
        isLoggedIn: true,
      };
    } else if (role === 'seller') {
      demoUser = {
        id: 'user-seller-1',
        email: 'elena.rostova@fineart.org',
        fullName: 'Elena Rostova',
        role: 'seller',
        sellerStatus: 'active_lifetime',
        paymentMethod: 'btc',
        upgradedAt: '2026-07-15T10:30:00Z',
        isLoggedIn: true,
      };
    } else {
      demoUser = {
        id: 'user-admin',
        email: 'admin@lensandcanvas.io',
        fullName: 'Vault Administrator',
        role: 'admin',
        sellerStatus: 'active_lifetime',
        isLoggedIn: true,
      };
    }

    onLoginSuccess(demoUser);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      
      {/* Prompt Banner if triggered by Gated action */}
      {promptMessage && (
        <div className="glass-panel border border-[#FF6321]/40 rounded-3xl p-5 text-center bg-[#FF6321]/10 space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#FF854D] font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#FF6321]" />
            Authentication Required
          </div>
          <p className="text-xs text-zinc-300 font-sans max-w-lg mx-auto">
            {promptMessage}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Story & Vault Security Info */}
        <div className="md:col-span-5 glass-card border border-zinc-800/80 rounded-3xl p-4 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6321]/15 border border-[#FF6321]/30 text-[#FF854D] text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-[#FF6321]" />
              Lens &amp; Canvas Authentication
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
              Secure Fine Art &amp; Photography <span className="artistic-gradient-text font-serif-italic">Vault</span>
            </h1>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Sign in to manage your high-resolution original artwork purchases, access encrypted download tokens, or submit your $1,500 lifetime creator membership deposit.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 font-sans">
            <div className="flex items-center gap-2 text-zinc-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Signed 24-Hour High-Res Download Links</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <Check className="w-4 h-4 text-[#FF854D] shrink-0" />
              <span>100% Royalty Retention for Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <Check className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Automated BTC &amp; Brand Gift Card Verification</span>
            </div>
          </div>


        </div>

        {/* Right Side: Form Container */}
        <div className="md:col-span-7 glass-panel border border-zinc-800/80 rounded-3xl p-4 sm:p-8 space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#121216] p-1.5 rounded-2xl border border-zinc-800 gap-1">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 text-[#FF6321]" />
              Sign In
            </button>

            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-[#FF6321] text-white glow-orange shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                  Email / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. creator@example.com or @Username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full artistic-gradient-bg text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg glow-orange transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                  Email / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. marcus@visuals.art or @Username"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3.5 pr-9 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3.5 pr-9 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6321]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Intention */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest block mb-1.5 font-mono">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleChoice('buyer')}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                      roleChoice === 'buyer'
                        ? 'bg-[#FF6321]/20 border-[#FF6321] text-white font-bold'
                        : 'bg-[#121216] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-white">Art Collector</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Purchase unwatermarked originals</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleChoice('seller')}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                      roleChoice === 'seller'
                        ? 'bg-[#7928CA]/30 border-[#7928CA] text-white font-bold'
                        : 'bg-[#121216] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-[#E040FB]">Creator / Seller</div>
                    <div className="text-[10px] text-zinc-400 font-normal">$1,500 Lifetime Membership</div>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full artistic-gradient-bg text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg glow-orange transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
