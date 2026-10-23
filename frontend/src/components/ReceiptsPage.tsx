import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Receipt, FinancialAccount, Category } from '../types';
import { Upload, Receipt as ReceiptIcon, CheckCircle2, AlertCircle, ArrowRight, Eye } from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Review & Confirm Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [reviewMerchant, setReviewMerchant] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [reviewAmount, setReviewAmount] = useState('');
  const [reviewAccountId, setReviewAccountId] = useState<number | ''>('');
  const [reviewCategoryId, setReviewCategoryId] = useState<number | ''>('');

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const [recs, accs, cats] = await Promise.all([
        api.getReceipts(),
        api.getAccounts(),
        api.getCategories(),
      ]);
      setReceipts(recs);
      setAccounts(accs);
      setCategories(cats);
      if (accs.length > 0 && reviewAccountId === '') {
        setReviewAccountId(accs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const rec = await api.uploadReceipt(file);
      setReceipts([rec, ...receipts]);
      openReviewModal(rec);
    } catch (err: any) {
      alert(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const openReviewModal = (rec: Receipt) => {
    setSelectedReceipt(rec);
    setReviewMerchant(rec.extracted_merchant || 'Merchant');
    setReviewDate(rec.extracted_date || new Date().toISOString().split('T')[0]);
    setReviewAmount(rec.extracted_total ? String(rec.extracted_total) : '25.00');
    if (accounts.length > 0) setReviewAccountId(accounts[0].id);
  };

  const handleConfirmTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt || !reviewAccountId) return;
    try {
      await api.confirmReceiptTransaction({
        receipt_id: selectedReceipt.id,
        account_id: Number(reviewAccountId),
        category_id: reviewCategoryId ? Number(reviewCategoryId) : undefined,
        merchant: reviewMerchant,
        transaction_date: reviewDate,
        total_amount: parseFloat(reviewAmount),
      });
      setSelectedReceipt(null);
      loadReceipts();
      alert('Receipt confirmed and transaction created!');
    } catch (err: any) {
      alert(err.message || 'Failed to create transaction from receipt');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Receipts & OCR Extraction
          </h1>
          <p className="text-sm text-[#706F6A] mt-0.5">
            Privately upload receipts, review extracted totals, and verify transactions
          </p>
        </div>

        <label className="btn-black px-4 py-2.5 text-xs font-medium cursor-pointer inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Scanning...' : 'Upload Receipt'}</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {receipts.length > 0 ? (
          receipts.map((rec) => (
            <div key={rec.id} className="elevate-card p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center">
                  <ReceiptIcon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                  rec.transaction_id
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {rec.transaction_id ? 'Linked to Transaction' : 'Pending Verification'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#111111]">
                  {rec.extracted_merchant || rec.file_name}
                </h3>
                <div className="text-xs text-[#706F6A] mt-0.5">
                  Scanned: {rec.extracted_date || 'Today'} · ${Number(rec.extracted_total || 0).toFixed(2)}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E9E1D5] flex items-center justify-between">
                <span className="text-[11px] text-[#969087]">
                  {rec.mime_type.split('/')[1]?.toUpperCase()} · {(rec.file_size_bytes / 1024).toFixed(1)} KB
                </span>

                {!rec.transaction_id ? (
                  <button
                    onClick={() => openReviewModal(rec)}
                    className="btn-black px-3 py-1.5 text-xs"
                  >
                    Review & Link
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#287650] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified #{rec.transaction_id}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-sm text-[#706F6A] bg-white rounded-3xl border border-[#E9E1D5]">
            {loading ? 'Loading receipts...' : 'No receipts uploaded yet. Click "Upload Receipt" above.'}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E9E1D5] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#111111] mb-1">Review Scanned Receipt</h3>
            <p className="text-xs text-[#706F6A] mb-4">
              Verify extracted fields before creating a permanent transaction in your ledger.
            </p>

            <form onSubmit={handleConfirmTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Merchant / Vendor</label>
                <input
                  type="text"
                  required
                  value={reviewMerchant}
                  onChange={(e) => setReviewMerchant(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-sm focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#706F6A] mb-1">Total Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={reviewAmount}
                    onChange={(e) => setReviewAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-sm focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#706F6A] mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Account to Charge</label>
                <select
                  value={reviewAccountId}
                  onChange={(e) => setReviewAccountId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs focus:outline-hidden"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Category</label>
                <select
                  value={reviewCategoryId}
                  onChange={(e) => setReviewCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs focus:outline-hidden"
                >
                  <option value="">Unassigned</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9E1D5]">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black px-5 py-2 rounded-xl font-medium"
                >
                  Confirm & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
