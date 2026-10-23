import React, { useState } from 'react';
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
import {
  LayoutDashboard, CreditCard, PiggyBank, BarChart3, UploadCloud,
  FileCheck2, SlidersHorizontal, Bot, Settings, LogOut, ArrowLeft,
  Sparkles, Menu, X, ShieldCheck
} from 'lucide-react';

type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'analytics'
  | 'imports'
  | 'receipts'
  | 'rules'
  | 'assistant'
  | 'settings';

const AppContent: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [viewingLanding, setViewingLanding] = useState<boolean>(!localStorage.getItem('token'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically transition between Workspace Dashboard and Landing/Login when auth state changes
  React.useEffect(() => {
    if (user) {
      setViewingLanding(false);
      setActiveTab('dashboard');
    } else {
      setViewingLanding(true);
    }
  }, [user]);

  // If user clicks "Open Workspace" from landing page
  const handleOpenApp = () => {
    if (!user) {
      openAuthModal();
    } else {
      setViewingLanding(false);
    }
  };

  if (viewingLanding) {
    return (
      <>
        <LandingPage onOpenApp={handleOpenApp} />
        <AuthModal />
      </>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'imports', label: 'CSV Import', icon: UploadCloud },
    { id: 'receipts', label: 'Receipts & OCR', icon: FileCheck2 },
    { id: 'rules', label: 'Rules & Categories', icon: SlidersHorizontal },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF5] text-[#111111] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FFFCF5]/90 backdrop-blur-md border-b border-[#E9E1D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#706F6A] hover:text-[#111111] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#080808] flex items-center justify-center text-white font-bold text-base shadow-xs">
              A
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#111111]">
                Aura Finance
              </span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-[#FFF0E2] text-[#FF6908] font-semibold border border-[#FF6908]/20">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingLanding(true)}
              className="text-xs font-medium text-[#706F6A] hover:text-[#111111] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#E9E1D5] transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[#E9E1D5]">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-[#111111] leading-tight">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-[#706F6A] font-mono leading-tight">
                    {user.currency_code}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-[#706F6A] hover:text-[#B83D35] hover:bg-[#B83D35]/10 rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="btn-black px-4 py-2 text-xs font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#FFFCF5] border-r border-[#E9E1D5] p-6 transform transition-transform duration-200 ease-in-out md:sticky md:top-24 md:self-start md:translate-x-0 md:border-r-0 md:p-0 md:w-56 md:flex-shrink-0 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="md:hidden flex items-center justify-between mb-6 pb-4 border-b border-[#E9E1D5]">
            <span className="font-bold text-sm text-[#111111]">Workspace Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-[#706F6A] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as NavTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#080808] text-white shadow-xs font-semibold'
                      : 'text-[#706F6A] hover:text-[#111111] hover:bg-[#F8F3E9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#706F6A]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#FF6908] text-white'
                          : 'bg-[#FFF0E2] text-[#FF6908] border border-[#FF6908]/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Info Box in Sidebar */}
          <div className="mt-8 p-4 rounded-xl border border-[#E9E1D5] bg-[#FFFDF9] text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#287650] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Grounded Model</span>
            </div>
            <p className="text-[11px] text-[#706F6A] leading-relaxed">
              Every financial computation is strictly derived from verified database rows.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <Dashboard onNavigate={(t) => setActiveTab(t as NavTab)} />}
          {activeTab === 'transactions' && <TransactionsPage />}
          {activeTab === 'budgets' && <BudgetsPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'imports' && (
            <ImportWizard onImportComplete={() => setActiveTab('transactions')} />
          )}
          {activeTab === 'receipts' && <ReceiptsPage />}
          {activeTab === 'rules' && <RulesPage />}
          {activeTab === 'assistant' && <AssistantPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Auth Modal */}
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
