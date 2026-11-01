import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../api';
import type {
  MonthlySummary, BudgetComparisonResponse, Transaction, CategoryTrendsResponse,
  RecurringCandidate, DuplicateCandidate,
} from '../types';
import { ArrowDownRight, ArrowUpRight, Bot, Copy, Repeat, Upload } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CountUp, Item, PageHeader, Segmented, Skeleton, Stagger } from './ui/primitives';
import { EASE_OUT } from '../lib/motion';
import { money, monthLabel } from '../utils';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const MONTHS = [
  { value: '2026-10', label: 'Oct 2026' },
  { value: '2026-09', label: 'Sep 2026' },
];

const ChartTip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="rounded-xl bg-night text-vellum px-3 py-2 text-[13px] shadow-xl">
      <p className="text-vellum/60 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="num flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: {money(p.value)}
        </p>
      ))}
    </div>
  ) : null;

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const reduce = useReducedMotion();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetComparisonResponse | null>(null);
  const [trends, setTrends] = useState<CategoryTrendsResponse | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringCandidate[]>([]);
  const [dups, setDups] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('2026-10');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.all([
      api.getMonthlySummary(period),
      api.getBudgetComparison(period),
      api.getCategoryTrends(period),
      api.getTransactions({ limit: 6 }),
      api.getRecurringExpenses().catch(() => []),
      api.getDuplicates().catch(() => []),
    ])
      .then(([s, b, t, tx, r, d]) => {
        if (!alive) return;
        setSummary(s); setBudgets(b); setTrends(t); setRecent(tx); setRecurring(r); setDups(d);
      })
      .catch((e) => alive && setError(e?.message || 'Could not load your overview.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [period]);

  const income = Number(summary?.total_income ?? 0);
  const expenses = Number(summary?.total_expenses ?? 0);
  const net = Number(summary?.net_cash_flow ?? 0);
  const saved = Number(summary?.savings_rate ?? 0);
  const spentShare = income > 0 ? Math.min(100, (expenses / income) * 100) : 0;
  const momPct = summary?.mom_expense_change_percent != null ? Number(summary.mom_expense_change_percent) : null;

  const flow = summary
    ? [
        { name: summary.previous_period_month ? monthLabel(summary.previous_period_month).split(' ')[0] : 'Previous', Income: Number(summary.previous_income ?? 0), Expenses: Number(summary.previous_expenses ?? 0) },
        { name: monthLabel(summary.period_month).split(' ')[0], Income: income, Expenses: expenses },
      ]
    : [];
  const cats = (trends?.categories ?? []).map((c) => ({ ...c, value: Number(c.amount) })).filter((c) => c.value > 0);

  const actions = (
    <>
      <Segmented label="Period" value={period} onChange={setPeriod} options={MONTHS} />
      <button onClick={() => onNavigate('imports')} className="btn-secondary px-4 py-2 text-[13px] flex items-center gap-2">
        <Upload className="w-3.5 h-3.5" /> Import CSV
      </button>
      <button onClick={() => onNavigate('assistant')} className="btn-black px-4 py-2 text-[13px] flex items-center gap-2">
        <Bot className="w-3.5 h-3.5 text-ember" /> Ask assistant
      </button>
    </>
  );

  if (error) {
    return (
      <div>
        <PageHeader title="Overview" actions={actions} />
        <div className="elevate-card p-8 text-sm text-bad">{error} Check that the API is running and try again.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Overview"
        description={<>Your money in <span className="text-ink font-medium">{monthLabel(period)}</span>, computed from verified ledger rows.</>}
        actions={actions}
      />

      {loading || !summary ? (
        <div className="grid lg:grid-cols-12 gap-4" aria-busy="true" aria-label="Loading overview">
          <Skeleton className="lg:col-span-7 h-[260px] !rounded-[28px]" />
          <div className="lg:col-span-5 grid gap-4"><Skeleton className="h-[122px] !rounded-[20px]" /><Skeleton className="h-[122px] !rounded-[20px]" /></div>
          <Skeleton className="lg:col-span-7 h-72 !rounded-[20px]" />
          <Skeleton className="lg:col-span-5 h-72 !rounded-[20px]" />
        </div>
      ) : (
        <Stagger key={period} className="grid lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Hero */}
          <Item className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[28px] bg-night text-vellum p-7 sm:p-9 h-full min-h-[260px] flex flex-col justify-between">
              <div aria-hidden className="absolute -right-24 -top-24 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(255,105,8,.28), transparent)' }} />
              <div className="relative">
                <p className="text-[13px] text-vellum/55">Net cash flow</p>
                <p className="mt-2 font-display text-[clamp(52px,7vw,84px)] leading-none tracking-[-0.02em]">
                  <CountUp value={Math.abs(net)} prefix={net < 0 ? '-$' : '$'} />
                </p>
                <p className="mt-3 text-[14px] text-vellum/65">
                  You kept <span className="text-vellum font-medium num">{saved.toFixed(1)}%</span> of what came in.
                </p>
              </div>
              <div className="relative mt-8">
                <div className="flex justify-between text-[12px] text-vellum/55 mb-2">
                  <span>Spent {money(expenses)}</span>
                  <span>of {money(income)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-vellum/12 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-ember"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${spentShare}%` }}
                    transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </Item>

          <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
            <Item>
              <div className="elevate-card p-6 h-full">
                <div className="flex items-center justify-between text-muted text-[13px]">
                  <span>Income</span>
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-ok/10 text-ok"><ArrowDownRight className="w-4 h-4" /></span>
                </div>
                <p className="mt-2 text-[30px] font-medium tracking-tight"><CountUp value={income} prefix="$" /></p>
                <p className="mt-1 text-[12.5px] text-muted">Across {summary.transaction_count} transactions this month</p>
              </div>
            </Item>
            <Item>
              <div className="elevate-card p-6 h-full">
                <div className="flex items-center justify-between text-muted text-[13px]">
                  <span>Expenses</span>
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-sand text-ink"><ArrowUpRight className="w-4 h-4" /></span>
                </div>
                <p className="mt-2 text-[30px] font-medium tracking-tight"><CountUp value={expenses} prefix="$" /></p>
                <p className={`mt-1 text-[12.5px] font-medium ${momPct == null ? 'text-muted' : momPct <= 0 ? 'text-ok' : 'text-bad'}`}>
                  {momPct == null ? 'No earlier month to compare' : `${momPct > 0 ? '+' : ''}${momPct.toFixed(1)}% vs ${monthLabel(summary.previous_period_month!).split(' ')[0]}`}
                </p>
              </div>
            </Item>
          </div>

          {/* Charts */}
          <Item className="lg:col-span-7">
            <div className="elevate-card p-6 h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[17px] font-medium">Income and expenses</h2>
                  <p className="text-[13px] text-muted mt-0.5">This month beside the last</p>
                </div>
                <div className="flex gap-4 text-[12.5px] text-muted">
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-ok" />Income</span>
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-night" />Expenses</span>
                </div>
              </div>
              <div className="h-64 mt-4" role="img" aria-label={`Income ${money(income)} and expenses ${money(expenses)} for ${monthLabel(period)}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flow} barGap={8} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6a6861' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6a6861' }} tickFormatter={(v) => (v === 0 ? "$0" : `$${v / 1000}k`)} />
                    <Tooltip cursor={{ fill: 'rgba(17,17,17,0.04)' }} content={<ChartTip />} />
                    <Bar dataKey="Income" fill="#287650" radius={[8, 8, 0, 0]} maxBarSize={56} animationDuration={900} />
                    <Bar dataKey="Expenses" fill="#0d0b09" radius={[8, 8, 0, 0]} maxBarSize={56} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Item>

          <Item className="lg:col-span-5">
            <div className="elevate-card p-6 h-full">
              <h2 className="text-[17px] font-medium">Where it went</h2>
              <p className="text-[13px] text-muted mt-0.5">Spending by category</p>
              {cats.length ? (
                <div className="mt-3 flex items-center gap-5">
                  <div className="relative w-[150px] h-[150px] shrink-0" role="img" aria-label="Spending by category">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={cats} dataKey="value" nameKey="category_name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none" animationDuration={1000}>
                          {cats.map((c) => <Cell key={c.category_id} fill={c.category_color} />)}
                        </Pie>
                        <Tooltip content={<ChartTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex-1 min-w-0 space-y-2 text-[13px]">
                    {cats.slice(0, 5).map((c) => (
                      <li key={c.category_id} className="flex items-center gap-2.5">
                        <i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.category_color }} />
                        <span className="truncate">{c.category_name}</span>
                        <span className="ml-auto num text-muted">{Number(c.percentage).toFixed(0)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-8 text-sm text-muted">No spending recorded for this month.</p>
              )}
            </div>
          </Item>

          {/* Insights */}
          <Item className="lg:col-span-12">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <button onClick={() => onNavigate('analytics')} className="elevate-card p-5 flex items-center gap-4 text-left group">
                <span className="grid place-items-center w-11 h-11 rounded-2xl bg-ember-soft text-ember-deep"><Repeat className="w-5 h-5" /></span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium">{recurring.length} recurring charges found</span>
                  <span className="block text-[13px] text-muted">Subscriptions and repeating bills, detected from your ledger</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <button onClick={() => onNavigate('analytics')} className="elevate-card p-5 flex items-center gap-4 text-left group">
                <span className={`grid place-items-center w-11 h-11 rounded-2xl ${dups.length ? 'bg-bad/10 text-bad' : 'bg-ok/10 text-ok'}`}><Copy className="w-5 h-5" /></span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium">{dups.length ? `${dups.length} possible double charge${dups.length > 1 ? 's' : ''} to review` : 'No double charges found'}</span>
                  <span className="block text-[13px] text-muted">Same merchant and amount within three days</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </Item>

          {/* Budgets + recent */}
          <Item className="lg:col-span-5">
            <div className="elevate-card p-6 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-medium">Budgets</h2>
                <button onClick={() => onNavigate('budgets')} className="text-[13px] text-ember-deep font-medium hover:underline">Manage</button>
              </div>
              <div className="mt-5 space-y-5">
                {budgets?.items?.length ? (
                  budgets.items.slice(0, 5).map((b, i) => {
                    const pct = Math.min(Number(b.utilization_percentage), 100);
                    return (
                      <div key={b.category_id}>
                        <div className="flex justify-between text-[13px] mb-1.5">
                          <span className="font-medium">{b.category_name}</span>
                          <span className={`num ${b.is_over_budget ? 'text-bad font-medium' : 'text-muted'}`}>
                            {money(b.actual_spent, { decimals: 0 })} of {money(b.budgeted_amount, { decimals: 0 })}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-sand overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${b.is_over_budget ? 'bg-bad' : pct > 80 ? 'bg-warn' : 'bg-night'}`}
                            initial={reduce ? false : { width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: EASE_OUT, delay: 0.25 + i * 0.07 }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted">No budgets set for this month. Add one from Budgets.</p>
                )}
              </div>
            </div>
          </Item>

          <Item className="lg:col-span-7">
            <div className="elevate-card h-full overflow-hidden">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-medium">Recent activity</h2>
                  <p className="text-[13px] text-muted mt-0.5">Latest entries in your ledger</p>
                </div>
                <button onClick={() => onNavigate('transactions')} className="btn-secondary px-3.5 py-1.5 text-[13px]">View all</button>
              </div>
              <ul className="divide-y divide-line border-t border-line">
                {recent.length ? recent.map((tx) => {
                  const amt = Number(tx.amount);
                  return (
                    <li key={tx.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-[#fdf8ec] transition-colors">
                      <span className="grid place-items-center w-9 h-9 rounded-full shrink-0 text-white text-[13px] font-medium" style={{ background: tx.category?.color || '#6a6861' }}>
                        {(tx.merchant || tx.description || '?')[0].toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium truncate">{tx.merchant || tx.description}</p>
                        <p className="text-[12.5px] text-muted">{tx.transaction_date} · {tx.category?.name || 'Unassigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`num text-[14px] font-medium ${amt > 0 ? 'text-ok' : ''}`}>{money(amt, { sign: true })}</p>
                        <p className="text-[11.5px] text-muted">{tx.categorization_method === 'rule' ? 'rule matched' : tx.categorization_method}</p>
                      </div>
                    </li>
                  );
                }) : (
                  <li className="p-8 text-sm text-muted text-center">No transactions yet. Import a CSV statement to begin.</li>
                )}
              </ul>
            </div>
          </Item>
        </Stagger>
      )}
    </div>
  );
}
