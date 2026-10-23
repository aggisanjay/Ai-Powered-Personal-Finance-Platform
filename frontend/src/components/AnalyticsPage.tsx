import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  CategoryTrendsResponse, RecurringCandidate, DuplicateCandidate
} from '../types';
import {
  TrendingUp, TrendingDown, Repeat, AlertTriangle, CheckCircle, ShieldCheck, PieChart as PieIcon
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [periodMonth, setPeriodMonth] = useState('2026-10');
  const [trends, setTrends] = useState<CategoryTrendsResponse | null>(null);
  const [recurring, setRecurring] = useState<RecurringCandidate[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [periodMonth]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [tData, rData, dData] = await Promise.all([
        api.getCategoryTrends(periodMonth),
        api.getRecurringExpenses(),
        api.getDuplicates(),
      ]);
      setTrends(tData);
      setRecurring(rData);
      setDuplicates(dData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDuplicate = async (id: number, action: 'confirm_duplicate' | 'keep_both') => {
    try {
      await api.resolveDuplicate(id, action);
      loadAnalytics();
    } catch (err) {
      alert('Failed to resolve duplicate candidate');
    }
  };

  const pieChartData = trends?.categories
    .filter((c) => Number(c.amount) > 0)
    .map((c) => ({
      name: c.category_name,
      value: Number(c.amount),
      color: c.category_color,
    })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Spending Trends & Pattern Analysis
          </h1>
          <p className="text-sm text-[#706F6A] mt-0.5">
            Deterministic category breakdowns, recurring subscriptions, and duplicate audit
          </p>
        </div>

        <select
          value={periodMonth}
          onChange={(e) => setPeriodMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs font-medium text-[#111111] focus:outline-hidden"
        >
          <option value="2026-10">October 2026</option>
          <option value="2026-09">September 2026</option>
        </select>
      </div>

      {/* Largest MoM Movers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="elevate-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#706F6A]">Largest Expense Increase</span>
            <div className="text-lg font-bold text-[#111111] mt-1">
              {trends?.largest_increase ? trends.largest_increase.category_name : 'None detected'}
            </div>
            {trends?.largest_increase && (
              <span className="text-xs text-red-600 font-semibold">
                +${Number(trends.largest_increase.mom_change_amount || 0).toFixed(2)} vs prior month
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="elevate-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#706F6A]">Largest Expense Decrease</span>
            <div className="text-lg font-bold text-[#111111] mt-1">
              {trends?.largest_decrease && Number(trends.largest_decrease.mom_change_amount || 0) < 0
                ? trends.largest_decrease.category_name
                : 'None detected'}
            </div>
            {trends?.largest_decrease && Number(trends.largest_decrease.mom_change_amount || 0) < 0 && (
              <span className="text-xs text-[#287650] font-semibold">
                -${Math.abs(Number(trends.largest_decrease.mom_change_amount || 0)).toFixed(2)} vs prior month
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-[#287650] flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Distribution Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="elevate-card p-6 bg-white flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111111] mb-1">Expense Breakdown</h3>
            <p className="text-xs text-[#706F6A] mb-4">Proportion of total monthly spending</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E9E1D5', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-[#706F6A]">
                No category expenses recorded for this month.
              </div>
            )}
          </div>
        </div>

        {/* Category Table */}
        <div className="lg:col-span-2 elevate-card bg-white overflow-hidden">
          <div className="p-4 bg-[#F8F3E9] border-b border-[#E9E1D5] text-xs font-bold text-[#111111]">
            Detailed Spending by Category
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFCF5] text-[#706F6A] border-b border-[#E9E1D5]">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">% of Total</th>
                  <th className="py-2.5 px-4 text-right">MoM Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D5]">
                {trends?.categories.map((c) => (
                  <tr key={c.category_id} className="hover:bg-[#FFFCF5]">
                    <td className="py-3 px-4 font-semibold text-[#111111] flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.category_color }} />
                      <span>{c.category_name}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#111111]">
                      ${Number(c.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#706F6A]">
                      {c.percentage}%
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {c.mom_change_amount !== null ? (
                        <span className={Number(c.mom_change_amount) > 0 ? 'text-red-600' : 'text-[#287650]'}>
                          {Number(c.mom_change_amount) > 0 ? '+' : ''}${Number(c.mom_change_amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[#969087]">New</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recurring Subscriptions & Duplicate Detector Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Payments */}
        <div className="elevate-card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#FF6908]" />
            <h3 className="text-base font-bold text-[#111111]">Recurring Expenses & Subscriptions</h3>
          </div>
          <p className="text-xs text-[#706F6A]">
            Detected automatically based on repeated merchant transactions occurring in consistent cycles (~30 days).
          </p>

          <div className="space-y-3">
            {recurring.length > 0 ? (
              recurring.map((rec) => (
                <div key={rec.id} className="p-3.5 rounded-2xl bg-[#FFFCF5] border border-[#E9E1D5] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#111111]">{rec.merchant}</div>
                    <div className="text-[#706F6A] text-[11px]">
                      Occurred {rec.occurrences_count} times · ~{rec.interval_days} day cycle
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#111111]">${Number(rec.amount).toFixed(2)}/mo</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 font-semibold">
                      {(Number(rec.confidence) * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#706F6A]">
                No recurring subscriptions detected yet.
              </div>
            )}
          </div>
        </div>

        {/* Duplicate Candidates */}
        <div className="elevate-card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-[#111111]">Duplicate Charge Auditor</h3>
          </div>
          <p className="text-xs text-[#706F6A]">
            Identifies possible double billings: identical amounts to the same merchant within 3 days.
          </p>

          <div className="space-y-3">
            {duplicates.length > 0 ? (
              duplicates.map((dup) => (
                <div key={dup.id} className="p-3.5 rounded-2xl bg-[#FFF5DF] border border-[#E9E1D5] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111]">Candidate #{dup.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                      dup.status === 'confirmed_duplicate'
                        ? 'bg-red-100 text-red-700'
                        : dup.status === 'resolved_distinct'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dup.status}
                    </span>
                  </div>
                  <div className="text-[#706F6A] text-[11px]">{dup.reason}</div>
                  {dup.status === 'detected' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleResolveDuplicate(dup.id, 'confirm_duplicate')}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-medium hover:bg-red-700"
                      >
                        Confirm Duplicate
                      </button>
                      <button
                        onClick={() => handleResolveDuplicate(dup.id, 'keep_both')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E9E1D5] text-[#111111] text-[11px] font-medium hover:bg-[#F8F3E9]"
                      >
                        Distinct Charges
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#706F6A]">
                No potential duplicate charges found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
