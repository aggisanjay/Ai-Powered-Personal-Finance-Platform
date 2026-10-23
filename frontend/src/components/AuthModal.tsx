import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { X, Sparkles, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          email,
          password,
          full_name: fullName || undefined,
          currency_code: currencyCode,
        });
        login(res.access_token, res.user);
      } else {
        const res = await api.login({ email, password });
        login(res.access_token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-[#E9E1D5] rounded-3xl p-8 shadow-2xl">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-[#706F6A] hover:text-[#111111] hover:bg-[#F8F3E9] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0E2] border border-[#FF6908]/20 text-xs font-semibold text-[#FF6908] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AURA FINANCIAL WORKSPACE</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-[#111111]">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-[#706F6A] mt-1 mb-6">
          {isRegister
            ? 'Sign up to begin verifiable, grounded financial analytics.'
            : 'Sign in to access your accounts, budgets, and AI assistant.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969087]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E1D5] text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969087]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E1D5] text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969087]" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E1D5] text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-colors"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5">Primary Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E9E1D5] text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl btn-black flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#706F6A]">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-semibold text-[#111111] hover:underline"
          >
            {isRegister ? 'Sign in' : 'Create one now'}
          </button>
        </div>
      </div>
    </div>
  );
};
