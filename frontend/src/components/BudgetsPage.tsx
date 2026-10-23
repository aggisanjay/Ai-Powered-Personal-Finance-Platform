import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BudgetComparisonResponse, Category } from '../types';
import {
  DollarSign, Plus, AlertTriangle, CheckCircle, ArrowRight,
  Edit2, Trash2, Tag, PiggyBank, Sparkles, TrendingUp
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const [periodMonth, setPeriodMonth] = useState('2026-10');
  const [data, setData] = useState<BudgetComparisonResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Set budget modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | ''>('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [modalTitle, setModalTitle] = useState('Set Category Budget');

  useEffect(() => {
    loadBudgets();
  }, [periodMonth]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const [comp, cats] = await Promise.all([
        api.getBudgetComparison(periodMonth),
        api.getCategories(),
      ]);
      setData(comp);
      const expenseCats = cats.filter((c) => !c.is_income);
      setCategories(expenseCats);
      if (expenseCats.length > 0 && selectedCatId === '') {
        setSelectedCatId(expenseCats[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (catId?: number, existingAmount?: number) => {
    if (catId) {
      setSelectedCatId(catId);
      setBudgetAmount(existingAmount ? String(existingAmount) : '');
      setModalTitle('Adjust Category Budget');
    } else {
      if (categories.length > 0) setSelectedCatId(categories[0].id);
      setBudgetAmount('');
      setModalTitle('Set Category Budget');
    }
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !budgetAmount) return;
    try {
      await api.setBudget({
        category_id: Number(selectedCatId),
        period_month: periodMonth,
        amount: parseFloat(budgetAmount),
      });
      setActionMessage({ text: 'Budget updated successfully.', type: 'success' });
      setIsModalOpen(false);
      setBudgetAmount('');
      loadBudgets();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to save budget', type: 'error' });
    }
  };

  const handleDeleteBudget = async (budgetId: number, catName: string) => {
    if (!confirm(`Are you sure you want to remove the budget for ${catName}?`)) return;
    try {
      await api.deleteBudget(budgetId);
      setActionMessage({ text: `Removed budget limit for ${catName}.`, type: 'success' });
      loadBudgets();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to remove budget', type: 'error' });
    }
  };

  // Find unbudgeted expense categories
  const budgetedCatIds = new Set(data?.items.map((i) => i.category_id) || []);
  const unbudgetedCategories = categories.filter((c) => !budgetedCatIds.has(c.id));

  const totalRemaining = data ? data.total_budgeted - data.total_actual : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF0E2] text-[#FF6908] border border-[#FF6908]/20">
              Deterministic Limits
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Monthly Budgets & Limits
          </h1>
          <p className="text-sm text-[#706F6A] mt-0.5">
            Monitor target category thresholds and actual spending computed from verified transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs font-semibold text-[#111111] focus:outline-hidden"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-11">November 2026</option>
          </select>

          <button
            onClick={() => handleOpenAddModal()}
            className="btn-black px-4 py-2 text-xs flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Budget</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-[#287650]/10 text-[#287650] border border-[#287650]/20'
              : 'bg-[#B83D35]/10 text-[#B83D35] border border-[#B83D35]/20'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="elevate-card p-5 bg-white">
          <p className="text-xs font-medium text-[#706F6A]">Total Monthly Budget</p>
          <p className="text-2xl font-bold text-[#111111] mt-1.5 font-mono">
            ${data ? Number(data.total_budgeted).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <p className="text-[11px] text-[#706F6A] mt-2">
            Target spending ceiling
          </p>
        </div>

        <div className="elevate-card p-5 bg-white">
          <p className="text-xs font-medium text-[#706F6A]">Total Actual Spent</p>
          <p className="text-2xl font-bold text-[#111111] mt-1.5 font-mono">
            ${data ? Number(data.total_actual).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <p className="text-[11px] text-[#706F6A] mt-2">
            Sum of confirmed debits
          </p>
        </div>

        <div className="elevate-card p-5 bg-white">
          <p className="text-xs font-medium text-[#706F6A]">Remaining Allowance</p>
          <p className={`text-2xl font-bold mt-1.5 font-mono ${
            totalRemaining < 0 ? 'text-[#B83D35]' : 'text-[#287650]'
          }`}>
            {totalRemaining < 0 ? '-' : ''}${Math.abs(totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#706F6A] mt-2">
            {totalRemaining < 0 ? 'Exceeded overall target' : 'Available until month end'}
          </p>
        </div>

        <div className="elevate-card p-5 bg-[#FFF5DF]">
          <p className="text-xs font-medium text-[#706F6A]">Overall Utilization</p>
          <p className={`text-2xl font-bold mt-1.5 font-mono ${
            data && data.overall_utilization_percentage > 100 ? 'text-[#B83D35]' : 'text-[#111111]'
          }`}>
            {data ? data.overall_utilization_percentage : 0}%
          </p>
          <div className="w-full h-1.5 bg-[#E9E1D5] rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                data && data.overall_utilization_percentage > 100
                  ? 'bg-[#B83D35]'
                  : data && data.overall_utilization_percentage > 85
                  ? 'bg-[#A66513]'
                  : 'bg-[#287650]'
              }`}
              style={{ width: `${Math.min(data?.overall_utilization_percentage || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Category Budgets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#111111]">Configured Category Budgets</h2>
          <span className="text-xs text-[#706F6A]">
            {data?.items?.length || 0} active categories
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#706F6A] elevate-card bg-white">
            Loading budget telemetry...
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((b) => (
              <div key={b.category_id} className="elevate-card p-5 bg-white flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: `${b.category_color}18`, color: b.category_color }}
                      >
                        $
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#111111]">{b.category_name}</h3>
                        <span className="text-xs font-mono text-[#706F6A]">
                          Limit: ${Number(b.budgeted_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(b.category_id, Number(b.budgeted_amount))}
                        className="p-1 text-[#969087] hover:text-[#111111] hover:bg-[#F8F3E9] rounded-lg transition-colors"
                        title="Adjust Budget"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {b.budget_id && (
                        <button
                          onClick={() => handleDeleteBudget(b.budget_id!, b.category_name)}
                          className="p-1 text-[#969087] hover:text-[#B83D35] hover:bg-[#B83D35]/10 rounded-lg transition-colors"
                          title="Delete Budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Utilization badge */}
                  <div className="mt-3">
                    {b.is_over_budget ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B83D35] bg-[#B83D35]/10 px-2.5 py-0.5 rounded-full border border-[#B83D35]/20">
                        <AlertTriangle className="w-3 h-3" /> Over Budget ({Number(b.utilization_percentage).toFixed(0)}%)
                      </span>
                    ) : Number(b.utilization_percentage) > 85 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A66513] bg-[#A66513]/10 px-2.5 py-0.5 rounded-full border border-[#A66513]/20">
                        <AlertTriangle className="w-3 h-3" /> Near Limit ({Number(b.utilization_percentage).toFixed(0)}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#287650] bg-[#287650]/10 px-2.5 py-0.5 rounded-full border border-[#287650]/20">
                        <CheckCircle className="w-3 h-3" /> On Track ({Number(b.utilization_percentage).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar and details */}
                <div className="pt-2 border-t border-[#E9E1D5]/60">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#111111]">${Number(b.actual_spent).toFixed(2)} spent</span>
                    <span className={Number(b.remaining_amount) < 0 ? 'text-[#B83D35] font-bold' : 'text-[#706F6A]'}>
                      {Number(b.remaining_amount) >= 0
                        ? `$${Number(b.remaining_amount).toFixed(2)} remaining`
                        : `$${Math.abs(Number(b.remaining_amount)).toFixed(2)} over budget`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F8F3E9] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.is_over_budget
                          ? 'bg-[#B83D35]'
                          : Number(b.utilization_percentage) > 85
                          ? 'bg-[#A66513]'
                          : 'bg-[#080808]'
                      }`}
                      style={{ width: `${Math.min(Number(b.utilization_percentage), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-[#706F6A] bg-white rounded-2xl border border-[#E9E1D5] elevate-card">
            <PiggyBank className="w-10 h-10 text-[#969087] mx-auto mb-3" />
            <p className="font-semibold text-[#111111] mb-1">No budgets set for {periodMonth}</p>
            <p className="text-xs text-[#706F6A] max-w-sm mx-auto mb-4">
              Add a monthly spending limit to receive over-budget warnings and pace your finances.
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="btn-black px-4 py-2 text-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Budget</span>
            </button>
          </div>
        )}
      </div>

      {/* Unbudgeted Categories Section */}
      {unbudgetedCategories.length > 0 && (
        <div className="elevate-card p-6 bg-[#FFFDF9]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#111111]">Other Expense Categories</h2>
              <p className="text-xs text-[#706F6A]">
                Categories without a defined threshold for {periodMonth}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {unbudgetedCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl border border-[#E9E1D5] bg-white flex items-center justify-between hover:border-[#D8CEBE] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-semibold text-[#111111] truncate">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleOpenAddModal(cat.id)}
                  className="btn-secondary px-2.5 py-1 text-[11px] font-medium shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Set</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9E1D5] rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111111] mb-1">{modalTitle}</h3>
            <p className="text-xs text-[#706F6A] mb-4">
              Set the monthly spending limit for <strong>{periodMonth}</strong>.
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white text-sm text-[#111111] focus:outline-hidden focus:border-[#111111]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Monthly Limit ($)</label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  required
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-sm text-[#111111] font-mono focus:outline-hidden focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E1D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black px-5 py-2 text-xs rounded-xl font-medium"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
