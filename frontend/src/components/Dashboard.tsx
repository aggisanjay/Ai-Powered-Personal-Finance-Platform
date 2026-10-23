import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { MonthlySummary, BudgetComparisonResponse, Transaction } from '../types';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight,
  ArrowDownRight, Plus, Upload, Bot, AlertTriangle, CheckCircle, Repeat
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetComparisonResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodMonth, setPeriodMonth] = useState('2026-10');

  useEffect(() => {
    loadData();
  }, [periodMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, budData, txData] = await Promise.all([
        api.getMonthlySummary(periodMonth),
        api.getBudgetComparison(periodMonth),
        api.getTransactions({ limit: 6 }),
      ]);
      setSummary(sumData);
      setBudgets(budData);
      setRecentTransactions(txData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const cashFlowChartData = summary ? [
    {
      name: summary.previous_period_month || 'Previous',
      Income: summary.previous_income || 0,
      Expenses: summary.previous_expenses || 0,
    },
    {
      name: summary.period_month,
      Income: summary.total_income,
      Expenses: summary.total_expenses,
    },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Financial Overview
          </h1>
          <p className="text-sm text-[#706F6A] mt-0.5">
            Real-time financial telemetry for <span className="font-semibold text-[#111111]">{periodMonth}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs font-medium text-[#111111] focus:outline-hidden"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
          </select>

          <button
            onClick={() => onNavigate('imports')}
            className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => onNavigate('assistant')}
            className="btn-black px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-[#FF6908]" />
            <span>Ask Assistant</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="elevate-card p-5 bg-white">
          <div className="flex items-center justify-between text-[#706F6A] mb-2">
            <span className="text-xs font-medium">Total Income</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#287650] flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#111111]">
            ${summary ? Number(summary.total_income).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 text-xs text-[#287650] flex items-center gap-1 font-medium">
            <span>Verified in {summary?.transaction_count || 0} deposits</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="elevate-card p-5 bg-white">
          <div className="flex items-center justify-between text-[#706F6A] mb-2">
            <span className="text-xs font-medium">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#B83D35] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#111111]">
            ${summary ? Number(summary.total_expenses).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 text-xs text-[#706F6A] flex items-center gap-1 font-medium">
            {summary?.mom_expense_change_percent !== null && (
              <span className={Number(summary?.mom_expense_change_amount || 0) > 0 ? 'text-[#B83D35]' : 'text-[#287650]'}>
                {Number(summary?.mom_expense_change_amount || 0) > 0 ? '+' : ''}
                {summary?.mom_expense_change_percent}% vs last mo
              </span>
            )}
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="elevate-card p-5 bg-[#FFF5DF]">
          <div className="flex items-center justify-between text-[#706F6A] mb-2">
            <span className="text-xs font-medium">Net Cash Flow</span>
            <div className="w-8 h-8 rounded-lg bg-white/80 text-[#111111] flex items-center justify-center border border-[#E9E1D5]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#111111]">
            ${summary ? Number(summary.net_cash_flow).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 text-xs text-[#706F6A] font-medium">
            Savings Rate: <span className="font-bold text-[#111111]">{summary?.savings_rate || 0}%</span>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="elevate-card p-5 bg-white">
          <div className="flex items-center justify-between text-[#706F6A] mb-2">
            <span className="text-xs font-medium">Budget Status</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#111111]">
            {budgets?.overall_utilization_percentage || 0}%
          </div>
          <div className="mt-2 text-xs text-[#706F6A] font-medium">
            Spent ${budgets?.total_actual.toLocaleString() || 0} of ${budgets?.total_budgeted.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Charts & Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Comparison Chart */}
        <div className="lg:col-span-2 elevate-card p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#111111]">Income vs Expenses</h3>
              <p className="text-xs text-[#706F6A]">Month-over-month deterministic comparison</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[#287650]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#287650]" />
                Income
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[#080808]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#080808]" />
                Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#706F6A' }} />
                <YAxis tick={{ fontSize: 12, fill: '#706F6A' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E9E1D5', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="Income" fill="#287650" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#080808" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Utilization Breakdown */}
        <div className="elevate-card p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#111111]">Category Budgets</h3>
              <button
                onClick={() => onNavigate('budgets')}
                className="text-xs font-semibold text-[#FF6908] hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-4">
              {budgets?.items && budgets.items.length > 0 ? (
                budgets.items.slice(0, 4).map((b) => (
                  <div key={b.category_id} className="text-xs">
                    <div className="flex items-center justify-between font-medium mb-1">
                      <span className="text-[#111111]">{b.category_name}</span>
                      <span className={b.is_over_budget ? 'text-red-600 font-bold' : 'text-[#706F6A]'}>
                        ${Number(b.actual_spent).toFixed(0)} / ${Number(b.budgeted_amount).toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F8F3E9] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          b.is_over_budget ? 'bg-red-500' : Number(b.utilization_percentage) > 80 ? 'bg-amber-500' : 'bg-[#080808]'
                        }`}
                        style={{ width: `${Math.min(Number(b.utilization_percentage), 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#706F6A] bg-[#FFFCF5] rounded-xl border border-[#E9E1D5]">
                  No budgets configured for this month.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E9E1D5]">
            <div className="p-3 rounded-xl bg-[#FFF5DF] border border-[#E9E1D5] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#111111]">
                <Repeat className="w-4 h-4 text-[#FF6908]" />
                <span>Recurring detector active</span>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-[#111111] hover:underline"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="elevate-card bg-white overflow-hidden">
        <div className="p-5 border-b border-[#E9E1D5] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111111]">Recent Activity</h3>
            <p className="text-xs text-[#706F6A]">Verifiable entries committed to your ledger</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="btn-secondary px-3.5 py-1.5 text-xs font-medium"
          >
            View all transactions
          </button>
        </div>

        <div className="divide-y divide-[#E9E1D5] overflow-x-auto">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#FFFCF5] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.amount > 0 ? 'bg-green-50 text-[#287650]' : 'bg-[#F8F3E9] text-[#111111]'
                  }`}>
                    {tx.amount > 0 ? '+' : '–'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111111]">
                      {tx.merchant || tx.description}
                    </div>
                    <div className="text-xs text-[#706F6A] flex items-center gap-2">
                      <span>{tx.transaction_date}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded-sm bg-[#F8F3E9] text-[#706F6A] font-medium">
                        {tx.category?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${Number(tx.amount) > 0 ? 'text-[#287650]' : 'text-[#111111]'}`}>
                    {Number(tx.amount) > 0 ? '+' : ''}${Math.abs(Number(tx.amount)).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-[#969087]">
                    {tx.categorization_method === 'rule' ? 'rule matched' : tx.categorization_method}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[#706F6A]">
              No transactions recorded yet. Click "Import CSV" to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
