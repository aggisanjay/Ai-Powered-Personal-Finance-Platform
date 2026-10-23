import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CategorizationRule, Category } from '../types';
import {
  Sparkles, Plus, Trash2, ArrowUpDown, Filter, Play, CheckCircle2, AlertCircle, Tag
} from 'lucide-react';

export const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New rule modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [pattern, setPattern] = useState('');
  const [fieldToMatch, setFieldToMatch] = useState('description');
  const [targetCategoryId, setTargetCategoryId] = useState<number | ''>('');
  const [priority, setPriority] = useState(10);

  // New category modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#FF6908');
  const [newCatIsIncome, setNewCatIsIncome] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, cData] = await Promise.all([
        api.getRules(),
        api.getCategories(),
      ]);
      setRules(rData);
      setCategories(cData);
      if (cData.length > 0 && targetCategoryId === '') {
        setTargetCategoryId(cData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !pattern.trim() || targetCategoryId === '') return;

    try {
      await api.createRule({
        name: ruleName.trim(),
        pattern: pattern.trim(),
        field_to_match: fieldToMatch,
        target_category_id: Number(targetCategoryId),
        priority: Number(priority),
        is_active: true,
      });
      setMessage({ text: 'Categorization rule created successfully.', type: 'success' });
      setIsModalOpen(false);
      setRuleName('');
      setPattern('');
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create rule', type: 'error' });
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await api.deleteRule(id);
      setRules(rules.filter(r => r.id !== id));
      setMessage({ text: 'Rule deleted.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete rule', type: 'error' });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.createCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'tag',
        is_income: newCatIsIncome,
      });
      setMessage({ text: 'Category created.', type: 'success' });
      setIsCatModalOpen(false);
      setNewCatName('');
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create category', type: 'error' });
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    setMessage(null);
    try {
      const res = await api.reprocessRules();
      setMessage({ text: res.message || 'Rules applied to all uncategorized records.', type: 'success' });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message || 'Reprocessing failed', type: 'error' });
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
            Categorization Rules & Categories
          </h1>
          <p className="text-sm text-[#706F6A] mt-1">
            Deterministic rules execute first with strict priority before any AI classification suggestions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="btn-secondary px-4 py-2.5 text-sm font-medium flex items-center gap-2"
          >
            <Play className={`w-4 h-4 text-[#FF6908] ${reprocessing ? 'animate-spin' : ''}`} />
            <span>{reprocessing ? 'Reprocessing...' : 'Execute Rules on Data'}</span>
          </button>
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="btn-secondary px-4 py-2.5 text-sm font-medium flex items-center gap-2"
          >
            <Tag className="w-4 h-4 text-[#706F6A]" />
            <span>New Category</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-black px-4 py-2.5 text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-[#287650]/10 text-[#287650] border border-[#287650]/20'
              : 'bg-[#B83D35]/10 text-[#B83D35] border border-[#B83D35]/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Rules Table */}
      <div className="elevate-card overflow-hidden">
        <div className="p-6 border-b border-[#E9E1D5] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#FF6908]" />
            <h2 className="text-base font-semibold text-[#111111]">Deterministic Priority Queue</h2>
          </div>
          <span className="text-xs text-[#706F6A] font-medium px-2.5 py-1 bg-[#F8F3E9] rounded-lg border border-[#E9E1D5]">
            {rules.length} Rules Active
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#706F6A]">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#706F6A]">
            No categorization rules defined yet. Create your first rule to automate merchant tagging.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#111111]">
              <thead className="bg-[#FAF7F0] border-b border-[#E9E1D5] text-xs font-semibold text-[#706F6A] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Priority</th>
                  <th className="py-3 px-6">Rule Name</th>
                  <th className="py-3 px-6">Target Field</th>
                  <th className="py-3 px-6">Pattern / Keyword</th>
                  <th className="py-3 px-6">Target Category</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D5]/60">
                {rules.map((rule) => {
                  const cat = categories.find((c) => c.id === rule.target_category_id);
                  return (
                    <tr key={rule.id} className="hover:bg-[#FFFDF9] transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-[#706F6A]">
                        #{rule.priority}
                      </td>
                      <td className="py-4 px-6 font-medium text-[#111111]">{rule.name}</td>
                      <td className="py-4 px-6 capitalize text-xs text-[#706F6A]">
                        <span className="px-2 py-1 rounded bg-[#F8F3E9] border border-[#E9E1D5]">
                          {rule.field_to_match}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-[#111111]">
                        <code>{rule.pattern}</code>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${cat?.color || '#FF6908'}15`,
                            color: cat?.color || '#FF6908',
                            border: `1px solid ${cat?.color || '#FF6908'}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat?.color || '#FF6908' }}
                          />
                          {cat?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-[#969087] hover:text-[#B83D35] hover:bg-[#B83D35]/10 rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div className="elevate-card p-6">
        <h2 className="text-base font-semibold text-[#111111] mb-4">Configured Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-xl border border-[#E9E1D5] bg-[#FFFDF9] flex items-center gap-2.5"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#111111] truncate">{c.name}</p>
                <p className="text-[10px] text-[#706F6A]">{c.is_income ? 'Income' : 'Expense'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E9E1D5] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111111] mb-1">Add Categorization Rule</h3>
            <p className="text-xs text-[#706F6A] mb-5">
              Automate category assignments when transactions match this keyword or regex.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#706F6A] mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Netflix Subscription"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#706F6A] mb-1">Keyword / Pattern</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., netflix|disney"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#706F6A] mb-1">Field to Match</label>
                  <select
                    value={fieldToMatch}
                    onChange={(e) => setFieldToMatch(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111]"
                  >
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#706F6A] mb-1">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#706F6A] mb-1">Target Category</label>
                <select
                  required
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.is_income ? 'Income' : 'Expense'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E1D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black px-5 py-2 text-sm font-medium"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E9E1D5] max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111111] mb-1">Create Category</h3>
            <p className="text-xs text-[#706F6A] mb-5">
              Add a custom category for classifying income and spending.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#706F6A] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pet Care"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#706F6A] mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-10 h-10 p-0 rounded-lg cursor-pointer border border-[#E9E1D5]"
                  />
                  <span className="text-xs font-mono text-[#706F6A]">{newCatColor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catIncome"
                  checked={newCatIsIncome}
                  onChange={(e) => setNewCatIsIncome(e.target.checked)}
                  className="rounded text-[#080808] focus:ring-0"
                />
                <label htmlFor="catIncome" className="text-xs text-[#111111] font-medium">
                  This is an Income category
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E1D5]">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black px-5 py-2 text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
