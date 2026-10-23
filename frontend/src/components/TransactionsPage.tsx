import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Transaction, Category, FinancialAccount } from '../types';
import {
  Search, Filter, Plus, Trash2, Edit2, Download, Check, AlertCircle, ArrowUpDown
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add transaction form state
  const [newDesc, setNewDesc] = useState('');
  const [newMerchant, setNewMerchant] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAccountId, setNewAccountId] = useState<number | ''>('');
  const [newCategoryId, setNewCategoryId] = useState<number | ''>('');
  const [isExpense, setIsExpense] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedAccount, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, cats, accs] = await Promise.all([
        api.getTransactions({
          category_id: selectedCategory ? Number(selectedCategory) : undefined,
          account_id: selectedAccount ? Number(selectedAccount) : undefined,
          search: searchTerm || undefined,
          limit: 100,
        }),
        api.getCategories(),
        api.getAccounts(),
      ]);
      setTransactions(txs);
      setCategories(cats);
      setAccounts(accs);
      if (accs.length > 0 && newAccountId === '') {
        setNewAccountId(accs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (txId: number, categoryId: number) => {
    try {
      const updated = await api.updateTransaction(txId, { category_id: categoryId });
      setTransactions(transactions.map((t) => (t.id === txId ? updated : t)));
    } catch (err) {
      alert('Failed to update category');
    }
  };

  const handleDelete = async (txId: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.deleteTransaction(txId);
      setTransactions(transactions.filter((t) => t.id !== txId));
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountId) return alert('Select an account');
    const amt = parseFloat(newAmount);
    if (isNaN(amt)) return alert('Enter a valid amount');

    try {
      const signedAmt = isExpense ? -Math.abs(amt) : Math.abs(amt);
      const created = await api.createTransaction({
        account_id: Number(newAccountId),
        category_id: newCategoryId ? Number(newCategoryId) : undefined,
        transaction_date: newDate,
        description: newDesc,
        merchant: newMerchant || undefined,
        amount: signedAmt,
        currency: 'USD',
        transaction_type: isExpense ? 'expense' : 'income',
      });
      setTransactions([created, ...transactions]);
      setIsAddModalOpen(false);
      setNewDesc('');
      setNewMerchant('');
      setNewAmount('');
    } catch (err: any) {
      alert(err.message || 'Failed to create transaction');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.downloadExportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Transactions Ledger
          </h1>
          <p className="text-sm text-[#706F6A] mt-0.5">
            Audit, categorize, and inspect all financial records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-black px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="elevate-card p-4 bg-white flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969087]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions by merchant, description, or amount..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#111111]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs text-[#111111] focus:outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white text-xs text-[#111111] focus:outline-hidden"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="elevate-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F3E9] text-[#706F6A] font-semibold border-b border-[#E9E1D5]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Categorization</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E1D5]">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FFFCF5] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#706F6A] whitespace-nowrap">
                      {tx.transaction_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111111]">
                        {tx.merchant || tx.description}
                      </div>
                      {tx.merchant && (
                        <div className="text-[11px] text-[#969087]">{tx.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={tx.category_id || ''}
                        onChange={(e) => handleCategoryChange(tx.id, Number(e.target.value))}
                        className="px-2 py-1 rounded-lg border border-[#E9E1D5] bg-white text-[11px] font-medium text-[#111111] focus:outline-hidden"
                      >
                        <option value="">Unassigned</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                        tx.categorization_method === 'rule'
                          ? 'bg-green-50 text-green-700'
                          : tx.categorization_method === 'manual'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {tx.categorization_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                      <span className={Number(tx.amount) > 0 ? 'text-[#287650]' : 'text-[#111111]'}>
                        {Number(tx.amount) > 0 ? '+' : ''}${Math.abs(Number(tx.amount)).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 text-[#969087] hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#706F6A]">
                    {loading ? 'Loading transactions...' : 'No transactions found matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E9E1D5] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#111111] mb-4">Add Transaction</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpense(true)}
                    className={`py-2 rounded-xl font-semibold border ${
                      isExpense ? 'bg-[#080808] text-white border-[#080808]' : 'bg-[#F8F3E9] text-[#706F6A] border-[#E9E1D5]'
                    }`}
                  >
                    Expense (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpense(false)}
                    className={`py-2 rounded-xl font-semibold border ${
                      !isExpense ? 'bg-[#287650] text-white border-[#287650]' : 'bg-[#F8F3E9] text-[#706F6A] border-[#E9E1D5]'
                    }`}
                  >
                    Income (+)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="45.50"
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Description / Memo</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Grocery trip"
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Merchant (Optional)</label>
                <input
                  type="text"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  placeholder="Trader Joe's"
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#706F6A] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#706F6A] mb-1">Account</label>
                  <select
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs focus:outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Category (Optional)</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs focus:outline-hidden"
                >
                  <option value="">Auto-assign via rules</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E1D5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black px-5 py-2 rounded-xl font-medium"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
