import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { BudgetsPage } from './components/BudgetsPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ReceiptsPage } from './components/ReceiptsPage';
import { ImportWizard } from './components/ImportWizard';
import { AssistantPage } from './components/AssistantPage';
import { RulesPage } from './components/RulesPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { Mark } from './components/ui/primitives';
import { EASE_OUT } from './lib/motion';
import {
  LayoutDashboard, CreditCard, PiggyBank, BarChart3, UploadCloud, FileCheck2,
  SlidersHorizontal, Bot, Settings, LogOut, ArrowLeft, Menu, X, ShieldCheck,
} from 'lucide-react';

type NavTab =
  | 'dashboard' | 'transactions' | 'budgets' | 'analytics'
  | 'imports' | 'receipts' | 'rules' | 'assistant' | 'settings';

const GROUPS: { label: string; items: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] }[] = [
  {
    label: 'Money',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'transactions', label: 'Transactions', icon: CreditCard },
      { id: 'budgets', label: 'Budgets', icon: PiggyBank },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Bring data in',
    items: [
      { id: 'imports', label: 'CSV import', icon: UploadCloud },
      { id: 'receipts', label: 'Receipts', icon: FileCheck2 },
      { id: 'rules', label: 'Rules', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Ask',
    items: [{ id: 'assistant', label: 'Assistant', icon: Bot, badge: 'AI' }],
  },
];

const AppContent: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [viewingLanding, setViewingLanding] = useState<boolean>(!localStorage.getItem('token'));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setViewingLanding(false);
      setActiveTab('dashboard');
    } else {
      setViewingLanding(true);
    }
  }, [user]);

  const handleOpenApp = () => (user ? setViewingLanding(false) : openAuthModal());

  if (viewingLanding) {
    return (
      <>
        <LandingPage onOpenApp={handleOpenApp} />
        <AuthModal />
      </>
    );
  }

  const go = (t: NavTab) => {
    setActiveTab(t);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const initials = (user?.full_name || user?.email || 'A')
    .split(/[\s@.]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('');

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-[68px] shrink-0">
        <Mark size={30} dark />
        <span className="font-display text-[24px] leading-none text-vellum">Aura</span>
      </div>

      <nav aria-label="Workspace" className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.label} className="mt-5 first:mt-2">
            <p className="px-3 pb-1.5 text-[12px] text-vellum/40">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => go(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors ${
                        active ? 'text-night font-medium' : 'text-vellum/65 hover:text-vellum hover:bg-vellum/6'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-vellum"
                          transition={{ type: 'spring', stiffness: 440, damping: 38 }}
                        />
                      )}
                      <Icon className="relative w-[17px] h-[17px]" />
                      <span className="relative">{item.label}</span>
                      {item.badge && (
                        <span className={`relative ml-auto text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold ${active ? 'bg-ember text-white' : 'bg-ember/15 text-ember'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-6 mx-1 p-3.5 rounded-2xl border border-vellum/10 bg-vellum/[0.04]">
          <div className="flex items-center gap-2 text-[12.5px] text-vellum font-medium">
            <ShieldCheck className="w-4 h-4 text-[#6fc29a]" /> Grounded answers
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-vellum/55">
            Every figure comes from verified rows in your ledger.
          </p>
        </div>
      </nav>

      <div className="shrink-0 p-3 border-t border-vellum/10">
        <button
          onClick={() => go('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors ${
            activeTab === 'settings' ? 'bg-vellum text-night font-medium' : 'text-vellum/65 hover:text-vellum hover:bg-vellum/6'
          }`}
        >
          <Settings className="w-[17px] h-[17px]" /> Settings and privacy
        </button>
        <div className="mt-2 flex items-center gap-3 px-3 py-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-ember text-white text-[12px] font-semibold">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-vellum truncate">{user?.full_name || user?.email?.split('@')[0]}</p>
            <p className="text-[11.5px] text-vellum/45 font-mono">{user?.currency_code}</p>
          </div>
          <button onClick={logout} title="Sign out" aria-label="Sign out" className="p-2 rounded-lg text-vellum/55 hover:text-[#ff8a7a] hover:bg-vellum/8 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const current = GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ?? 'Settings and privacy';

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[260px] bg-night z-30">{sidebar}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-night z-50"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 h-[60px] px-4 sm:px-8 flex items-center justify-between bg-paper/85 backdrop-blur-xl border-b border-line">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-muted hover:text-ink" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[13.5px] text-muted">Workspace</span>
            <span className="text-line">/</span>
            <span className="text-[13.5px] font-medium">{current}</span>
          </div>
          <button
            onClick={() => setViewingLanding(true)}
            className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink px-3 py-1.5 rounded-full hover:bg-sand transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to site</span>
          </button>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
            >
              {activeTab === 'dashboard' && <Dashboard onNavigate={(t) => go(t as NavTab)} />}
              {activeTab === 'transactions' && <TransactionsPage />}
              {activeTab === 'budgets' && <BudgetsPage />}
              {activeTab === 'analytics' && <AnalyticsPage />}
              {activeTab === 'imports' && <ImportWizard onImportComplete={() => go('transactions')} />}
              {activeTab === 'receipts' && <ReceiptsPage />}
              {activeTab === 'rules' && <RulesPage />}
              {activeTab === 'assistant' && <AssistantPage />}
              {activeTab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
