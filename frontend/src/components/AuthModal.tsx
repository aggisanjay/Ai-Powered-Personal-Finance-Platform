import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mark } from './ui/primitives';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { X, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuthModal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthModalOpen, closeAuthModal]);

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
    <AnimatePresence>
      {isAuthModalOpen && (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-night/70 backdrop-blur-md p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeAuthModal()}
      role="dialog" aria-modal="true" aria-label={isRegister ? 'Create your account' : 'Sign in'}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-paper border border-line rounded-[28px] p-8 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)]">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-muted hover:text-ink hover:bg-sand rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <Mark size={36} className="mb-5" />

        <h2 className="font-display text-[38px] leading-none tracking-[-0.01em] text-ink">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-muted mt-1 mb-6">
          {isRegister
            ? 'Import a statement and get answers you can check.'
            : 'Sign in to your ledger, budgets and assistant.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line text-sm text-ink bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                autoFocus={!isRegister}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line text-sm text-ink bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line text-sm text-ink bg-white transition-colors"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-line text-sm text-ink bg-white transition-colors"
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
            <span>{loading ? 'Working…' : isRegister ? 'Create account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-muted">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-semibold text-ink hover:underline"
          >
            {isRegister ? 'Sign in' : 'Create one now'}
          </button>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
