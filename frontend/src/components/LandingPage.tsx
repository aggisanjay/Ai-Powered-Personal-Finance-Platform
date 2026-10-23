import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, ArrowRight, ShieldCheck, FileSpreadsheet, Bot,
  TrendingUp, CheckCircle2, ChevronDown, Layers, Zap, Database, Lock
} from 'lucide-react';

export const LandingPage: React.FC<{ onOpenApp: () => void }> = ({ onOpenApp }) => {
  const { user, openAuthModal } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleAction = () => {
    if (user) {
      onOpenApp();
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] text-[#111111]">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#FFFCF5]/90 backdrop-blur-md border-b border-[#E9E1D5]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#080808] flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Aura Finance</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-[#FFF0E2] text-[#FF6908] font-medium border border-[#FF6908]/20">
                AI Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#706F6A]">
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#111111] transition-colors">How it works</a>
            <a href="#security" className="hover:text-[#111111] transition-colors">Security</a>
            <a href="#faq" className="hover:text-[#111111] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={onOpenApp}
                className="btn-black px-5 py-2.5 text-sm font-medium flex items-center gap-2"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={openAuthModal}
                  className="text-sm font-medium text-[#706F6A] hover:text-[#111111] transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={openAuthModal}
                  className="btn-black px-5 py-2.5 text-sm font-medium flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0E2] border border-[#FF6908]/25 text-xs font-semibold text-[#FF6908] mb-8 shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>GROUNDED FINANCIAL INTELLIGENCE</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111] leading-[1.08] mb-7">
            Turn Every Financial Record <br className="hidden sm:inline" />
            Into Verifiable Clarity
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#706F6A] font-normal leading-relaxed mb-10">
            Import statements, monitor category budgets, discover recurring subscriptions,
            and query your finances in natural language—backed by deterministic arithmetic.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={handleAction}
              className="w-full sm:w-auto btn-black px-8 py-4 text-base font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <span>{user ? 'Enter Workspace' : 'Explore the Workspace'}</span>
              <ArrowRight className="w-4 h-4 text-[#FF6908]" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto btn-secondary px-8 py-4 text-base font-medium flex items-center justify-center gap-2"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Capability Strip */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs sm:text-sm font-medium text-[#706F6A] border-t border-[#E9E1D5] pt-6">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#287650]" />
              Zero Hallucinated Numbers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#287650]" />
              Multi-Format Statement Ingestion
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#287650]" />
              Private Tenant Isolation
            </span>
          </div>
        </div>

        {/* Real Product Interactive Preview Card */}
        <div className="max-w-5xl mx-auto mt-16 elevate-card p-6 sm:p-8 bg-white border border-[#E9E1D5]">
          <div className="flex items-center justify-between pb-4 border-b border-[#E9E1D5] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs font-semibold text-[#706F6A] ml-2">Aura Live Workspace Preview</span>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#FFF5DF] text-[#706F6A] border border-[#E9E1D5]">
              Real Backend Data Grounded
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Monthly KPI + Ledger sample */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E9E1D5]">
                  <div className="text-xs text-[#706F6A] font-medium">Income (Oct 2026)</div>
                  <div className="text-xl font-bold text-[#287650] mt-1">$5,750.00</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E9E1D5]">
                  <div className="text-xs text-[#706F6A] font-medium">Expenses (Oct 2026)</div>
                  <div className="text-xl font-bold text-[#111111] mt-1">$3,169.52</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF5DF] border border-[#E9E1D5]">
                  <div className="text-xs text-[#706F6A] font-medium">Net Cash Flow</div>
                  <div className="text-xl font-bold text-[#111111] mt-1">+$2,580.48</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E9E1D5] overflow-hidden">
                <div className="bg-[#F8F3E9] px-4 py-2.5 text-xs font-semibold text-[#706F6A] flex justify-between">
                  <span>Recent Verified Transactions</span>
                  <span>Method</span>
                </div>
                <div className="divide-y divide-[#E9E1D5] text-xs">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#111111]">Costco Wholesale #48</div>
                      <div className="text-[#969087]">Groceries · Oct 18, 2026</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#111111]">-$230.15</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-50 text-green-700 font-medium">rule matched</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#111111]">Netflix Premium Subscription</div>
                      <div className="text-[#969087]">Subscriptions · Oct 05, 2026</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#111111]">-$22.99</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 font-medium">recurring</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#111111]">Direct Deposit - TechCorp</div>
                      <div className="text-[#969087]">Salary & Income · Oct 01, 2026</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#287650]">+$4,500.00</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 font-medium">verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: AI Assistant Live Answer */}
            <div className="p-5 rounded-2xl bg-[#FFF5DF] border border-[#E9E1D5] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-[#FF6908]" />
                  <span className="text-xs font-bold text-[#111111]">Natural Language Assistant</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E9E1D5] text-xs font-medium text-[#111111] mb-3">
                  "How much did I spend on groceries in October compared to last month?"
                </div>
                <p className="text-xs text-[#706F6A] leading-relaxed">
                  You spent <strong className="text-[#111111]">$502.80</strong> on Groceries in Oct 2026 across 3 transactions. Compared to Sep ($427.70), this represents an increase of <strong className="text-[#111111]">$75.10</strong>.
                </p>
                <div className="mt-3 pt-3 border-t border-[#E9E1D5] text-[11px] text-[#969087]">
                  <strong>Evidence:</strong> Linked to transactions #4, #5, #6.
                </div>
              </div>

              <button
                onClick={handleAction}
                className="w-full mt-4 py-2.5 px-3 rounded-xl bg-[#080808] text-white text-xs font-medium hover:bg-[#292929] transition-colors text-center"
              >
                Ask Your Finances
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-[#FFF5DF]/40 border-y border-[#E9E1D5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6908]">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2 mb-4">
              Built For Absolute Financial Verifiability
            </h2>
            <p className="text-base text-[#706F6A]">
              Every metric, trend, and response is deterministically computed from your stored records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="elevate-card p-6 bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mb-5">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Statement Ingestion</h3>
              <p className="text-sm text-[#706F6A] leading-relaxed">
                Upload CSV statements from any bank or card. Interactive preview with auto-detected date formats, debit/credit splitting, and duplicate row detection.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="elevate-card p-6 bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Two-Tier Categorization</h3>
              <p className="text-sm text-[#706F6A] leading-relaxed">
                Deterministic regex and pattern matching rules execute first with 100% transparency. AI assists only for ambiguous transactions without modifying records.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="elevate-card p-6 bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Decimal-Safe Analytics</h3>
              <p className="text-sm text-[#706F6A] leading-relaxed">
                Financial calculations strictly use Python Decimal arithmetic. Zero floating-point rounding errors and division-by-zero protections on all MoM trends.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="elevate-card p-6 bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Grounded AI Assistant</h3>
              <p className="text-sm text-[#706F6A] leading-relaxed">
                Ask questions like "How much did transport rise this month?" and receive responses backed by specific transaction IDs, never invented figures.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="elevate-card p-6 bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Subscriptions & Duplicates</h3>
              <p className="text-sm text-[#706F6A] leading-relaxed">
                Algorithmic detection of repeating charges across weekly and monthly intervals, alongside duplicate charge warnings with one-click resolution.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="elevate-card p-6 bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">Tenant Privacy & Auditing</h3>
              <p className="text-sm text-[#706F6A] leading-relaxed">
                Strict backend user ownership on all queries. Formula-injection safe CSV downloads, immutable audit event logs, and permanent account deletion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6908]">Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2 mb-4">
              Simple, Reliable Financial Control
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5]">
              <div className="w-10 h-10 rounded-full bg-[#080808] text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h4 className="text-lg font-bold text-[#111111] mb-2">Import or Scan</h4>
              <p className="text-sm text-[#706F6A]">
                Drag and drop your bank CSV statements or receipts. Preview mapping and validate dates and amounts before committing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5]">
              <div className="w-10 h-10 rounded-full bg-[#080808] text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h4 className="text-lg font-bold text-[#111111] mb-2">Auto-Categorize & Budget</h4>
              <p className="text-sm text-[#706F6A]">
                Customizable rules categorize transactions instantly. Track category utilization and receive alerts before exceeding budget limits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E9E1D5]">
              <div className="w-10 h-10 rounded-full bg-[#080808] text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h4 className="text-lg font-bold text-[#111111] mb-2">Ask & Uncover Insights</h4>
              <p className="text-sm text-[#706F6A]">
                Engage with your financial records in plain English. Get answers backed by verified calculations and linked source transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 bg-[#FFF5DF]/60 border-t border-[#E9E1D5]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#080808] text-white flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-7 h-7 text-[#FF6908]" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#111111] mb-4">
            Security Designed For Personal Privacy
          </h2>
          <p className="text-base text-[#706F6A] max-w-2xl mx-auto mb-10 leading-relaxed">
            We never connect directly to your bank credentials or store sensitive passwords. Your financial data is isolated with strict tenant-level access controls and fully exportable at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5]">
              <div className="font-semibold text-sm text-[#111111] mb-1">Spreadsheet Injection Defense</div>
              <p className="text-xs text-[#706F6A]">All CSV exports are sanitized against malicious formula execution in Excel and Sheets.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5]">
              <div className="font-semibold text-sm text-[#111111] mb-1">PBKDF2 & JWT Auth</div>
              <p className="text-xs text-[#706F6A]">Cryptographically salted credentials with time-bound JWT session tokens.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E9E1D5]">
              <div className="font-semibold text-sm text-[#111111] mb-1">Complete Audit Trail</div>
              <p className="text-xs text-[#706F6A]">Every import, deletion, category edit, and data export is immutably logged.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#111111] mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Does this platform require linking real online bank logins?",
                a: "No. The platform operates on user-uploaded statements (CSV) and receipts. It never asks for, nor does it store, online banking passwords."
              },
              {
                q: "How does the AI Assistant avoid hallucinating numbers?",
                a: "The assistant does not do arithmetic. Instead, it extracts the parameters of your question, executes deterministic SQL queries on verified records, and presents the resulting calculations with clickable citations."
              },
              {
                q: "Can I export all my data or delete my account?",
                a: "Yes. From Settings, you can download a complete CSV of all transactions (sanitized against spreadsheet formula injection) or permanently purge your account and all associated data."
              },
              {
                q: "How does receipt scanning work?",
                a: "You upload a receipt image, the OCR engine extracts merchant, date, and amounts, and displays them for your review and confirmation before creating any transaction."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E9E1D5] bg-white overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-semibold text-sm text-[#111111] flex items-center justify-between"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#706F6A] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#706F6A] leading-relaxed border-t border-[#E9E1D5] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E9E1D5] py-12 px-6 bg-[#FFFCF5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#080808] flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="font-bold text-sm">Aura Personal Finance</span>
          </div>
          <div className="text-xs text-[#706F6A]">
            Informational budgeting and analytics tool. Not an investment, accounting, or tax adviser.
          </div>
          <div className="flex items-center gap-6 text-xs text-[#706F6A]">
            <a href="#features" className="hover:text-[#111111]">Features</a>
            <a href="#security" className="hover:text-[#111111]">Security</a>
            <button onClick={openAuthModal} className="hover:text-[#111111]">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
