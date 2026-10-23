import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CSVPreviewResponse, ColumnMapping, FinancialAccount } from '../types';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  RefreshCw, Check, ArrowLeft
} from 'lucide-react';

interface ImportWizardProps {
  onImportComplete: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onImportComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date_col: '',
    description_col: '',
    amount_col: '',
    debit_col: '',
    credit_col: '',
    merchant_col: '',
    currency_col: '',
  });
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [applyRules, setApplyRules] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  useEffect(() => {
    api.getAccounts().then((accs) => {
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setLoading(true);

    try {
      const p = await api.previewCSV(selected);
      let map = { ...p.suggested_mapping };

      // Helper to test if a string resembles a valid date (rejecting ticket IDs & numbers)
      const isDateValue = (val: string) => {
        if (!val) return false;
        const s = String(val).trim();
        if (/^[A-Za-z]{1,8}[-_]\d+$/i.test(s)) return false; // reject tickets like TKT-1001
        if (/^[-+]?\$?[\d,]+(\.\d+)?$/.test(s)) return false; // reject amounts
        const d = Date.parse(s);
        return !isNaN(d) && s.length >= 6;
      };

      const testColDate = (col: string) => {
        if (!col) return 0;
        return (p.sample_rows || []).filter(r => isDateValue(r.raw_data?.[col])).length;
      };

      // If suggested date_col has 0 valid dates, find the column that actually has dates
      if (testColDate(map.date_col) === 0) {
        let bestCol = '';
        let maxMatches = 0;
        for (const c of p.available_columns) {
          const m = testColDate(c);
          if (m > maxMatches) {
            maxMatches = m;
            bestCol = c;
          }
        }
        if (bestCol && maxMatches > 0) {
          if (map.description_col === bestCol) {
            map.description_col = map.date_col || p.available_columns.find(c => c !== bestCol) || '';
          }
          map.date_col = bestCol;
        }
      }

      setPreview(p);
      setMapping(map);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to inspect CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !file || !selectedAccountId) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('account_id', String(selectedAccountId));
    formData.append('filename', preview.filename);
    formData.append('date_col', mapping.date_col);
    formData.append('description_col', mapping.description_col);
    if (mapping.amount_col) formData.append('amount_col', mapping.amount_col);
    if (mapping.debit_col) formData.append('debit_col', mapping.debit_col);
    if (mapping.credit_col) formData.append('credit_col', mapping.credit_col);
    if (mapping.merchant_col) formData.append('merchant_col', mapping.merchant_col);
    if (mapping.currency_col) formData.append('currency_col', mapping.currency_col);
    formData.append('apply_rules', String(applyRules));

    try {
      const res = await api.confirmImport(formData);
      setImportResult(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Import failed to commit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Statement Import Wizard
        </h1>
        <p className="text-sm text-[#706F6A] mt-0.5">
          Upload bank or credit card CSV statements with interactive column mapping
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 py-2 border-b border-[#E9E1D5] text-xs font-semibold">
        <span className={step >= 1 ? 'text-[#111111]' : 'text-[#969087]'}>1. Upload Statement</span>
        <span className="text-[#E9E1D5]">/</span>
        <span className={step >= 2 ? 'text-[#111111]' : 'text-[#969087]'}>2. Map & Preview Rows</span>
        <span className="text-[#E9E1D5]">/</span>
        <span className={step >= 3 ? 'text-[#111111]' : 'text-[#969087]'}>3. Import Summary</span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: File Dropzone */}
      {step === 1 && (
        <div className="elevate-card p-12 bg-white text-center border-2 border-dashed border-[#E9E1D5] hover:border-[#111111] transition-all">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#111111] mb-1">Upload your bank statement (CSV)</h3>
          <p className="text-xs text-[#706F6A] max-w-sm mx-auto mb-6">
            Supports CSV statements from Chase, Bank of America, Wells Fargo, Amex, Capital One, or custom exports.
          </p>

          <label className="btn-black px-6 py-3 text-xs font-medium cursor-pointer inline-flex items-center gap-2">
            <span>{loading ? 'Inspecting file...' : 'Select CSV File'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Step 2: Mapping & Preview */}
      {step === 2 && preview && (
        <div className="space-y-6">
          {/* Target Account & Rules Config */}
          <div className="elevate-card p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Target Financial Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] text-xs font-medium text-[#111111] focus:outline-hidden"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.account_type}) - Balance: ${Number(a.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="applyRulesCheck"
                checked={applyRules}
                onChange={(e) => setApplyRules(e.target.checked)}
                className="w-4 h-4 rounded-md accent-[#080808]"
              />
              <label htmlFor="applyRulesCheck" className="text-xs font-medium text-[#111111] cursor-pointer">
                Auto-apply categorization rules to matched transactions
              </label>
            </div>
          </div>

          {/* Column Mapping Controls */}
          <div className="elevate-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">Column Mapping</h3>
            <p className="text-xs text-[#706F6A]">
              We automatically detected column headers. Adjust if any field is mapped incorrectly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Date Column *</label>
                <select
                  value={mapping.date_col}
                  onChange={(e) => setMapping({ ...mapping, date_col: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white"
                >
                  {preview.available_columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Description Column *</label>
                <select
                  value={mapping.description_col}
                  onChange={(e) => setMapping({ ...mapping, description_col: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white"
                >
                  {preview.available_columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Amount Column (Signed)</label>
                <select
                  value={mapping.amount_col || ''}
                  onChange={(e) => setMapping({ ...mapping, amount_col: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white"
                >
                  <option value="">-- None (use Debit/Credit) --</option>
                  {preview.available_columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Debit Column (Outflow)</label>
                <select
                  value={mapping.debit_col || ''}
                  onChange={(e) => setMapping({ ...mapping, debit_col: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white"
                >
                  <option value="">-- None --</option>
                  {preview.available_columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Credit Column (Inflow)</label>
                <select
                  value={mapping.credit_col || ''}
                  onChange={(e) => setMapping({ ...mapping, credit_col: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white"
                >
                  <option value="">-- None --</option>
                  {preview.available_columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#706F6A] mb-1">Merchant (Optional)</label>
                <select
                  value={mapping.merchant_col || ''}
                  onChange={(e) => setMapping({ ...mapping, merchant_col: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9E1D5] bg-white"
                >
                  <option value="">-- None --</option>
                  {preview.available_columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sample Rows Table (Dynamically evaluated based on selected mapping) */}
          {(() => {
            const evaluatedRows = preview.sample_rows.map((r) => {
              const rawDate = r.raw_data[mapping.date_col] || '';
              const rawDesc = r.raw_data[mapping.description_col] || '';
              const rawAmt = mapping.amount_col
                ? r.raw_data[mapping.amount_col]
                : (mapping.debit_col && r.raw_data[mapping.debit_col]
                ? '-' + r.raw_data[mapping.debit_col]
                : (mapping.credit_col ? r.raw_data[mapping.credit_col] : ''));

              const cleanedAmt = String(rawAmt || '').replace(/[^0-9.-]/g, '');
              const numAmt = parseFloat(cleanedAmt);
              const isDateValid = !isNaN(Date.parse(rawDate)) && String(rawDate).trim().length >= 6;
              const isAmtValid = !isNaN(numAmt) && rawAmt !== null && rawAmt !== undefined && rawAmt !== '';
              const isDescValid = Boolean(rawDesc && String(rawDesc).trim().length > 0);

              let error = null;
              if (!isDateValid) error = `Invalid date: '${rawDate}'`;
              else if (!isAmtValid) error = 'Missing/invalid amount';
              else if (!isDescValid) error = 'Missing description';

              return {
                row_number: r.row_number,
                parsed_date: rawDate || '-',
                parsed_description: rawDesc || '-',
                parsed_amount: isAmtValid ? numAmt : null,
                is_valid: !error,
                validation_error: error,
              };
            });

            const validCount = evaluatedRows.filter((r) => r.is_valid).length;
            const invalidCount = evaluatedRows.length - validCount;

            // Check if current date_col has errors and another available column contains dates
            const isDateValue = (val: string) => {
              if (!val) return false;
              const s = String(val).trim();
              if (/^[A-Za-z]{1,8}[-_]\d+$/i.test(s)) return false;
              if (/^[-+]?\$?[\d,]+(\.\d+)?$/.test(s)) return false;
              const d = Date.parse(s);
              return !isNaN(d) && s.length >= 6;
            };

            const detectedDateCol = preview.available_columns.find((c) => {
              if (c === mapping.date_col) return false;
              const matches = preview.sample_rows.filter((r) => isDateValue(r.raw_data?.[c])).length;
              return matches >= Math.min(2, preview.sample_rows.length);
            });

            const hasDateError = evaluatedRows.some((r) => r.validation_error?.startsWith('Invalid date'));

            return (
              <div className="space-y-4">
                {hasDateError && detectedDateCol && (
                  <div className="p-4 rounded-2xl bg-[#FFF0E2] border border-[#FF6908]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#111111]">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[#FF6908] shrink-0" />
                      <div>
                        <span className="font-bold text-[#111111]">Column Alignment Recommendation:</span>
                        <p className="text-[#706F6A]">
                          Column <span className="font-semibold text-[#111111]">'{mapping.date_col}'</span> contains ticket/ID data. Detected date timestamps in column <span className="font-semibold text-[#FF6908]">'{detectedDateCol}'</span>.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const oldDate = mapping.date_col;
                        const newDesc = mapping.description_col === detectedDateCol ? oldDate : mapping.description_col;
                        setMapping({
                          ...mapping,
                          date_col: detectedDateCol,
                          description_col: newDesc,
                        });
                      }}
                      className="btn-black py-2 px-4 whitespace-nowrap text-xs shadow-sm hover:bg-[#FF6908] transition-colors"
                    >
                      Auto-Align to '{detectedDateCol}'
                    </button>
                  </div>
                )}

                <div className="elevate-card bg-white overflow-hidden">
                  <div className="p-4 bg-[#F8F3E9] border-b border-[#E9E1D5] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111111]">
                      Sample Parsed Rows (First 25 of {preview.total_detected_rows})
                    </span>
                    <span className="text-[#706F6A]">
                      {validCount} valid, {invalidCount} skipped/invalid
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFFCF5] text-[#706F6A] border-b border-[#E9E1D5]">
                        <tr>
                          <th className="py-2.5 px-4">Row</th>
                          <th className="py-2.5 px-4">Parsed Date</th>
                          <th className="py-2.5 px-4">Parsed Description</th>
                          <th className="py-2.5 px-4 text-right">Parsed Amount</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E1D5]">
                        {evaluatedRows.map((r) => (
                          <tr key={r.row_number} className={r.is_valid ? '' : 'bg-red-50/50'}>
                            <td className="py-2.5 px-4 font-mono text-[#706F6A]">#{r.row_number}</td>
                            <td className="py-2.5 px-4">{r.parsed_date}</td>
                            <td className="py-2.5 px-4 font-medium text-[#111111]">
                              {r.parsed_description}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold">
                              {r.parsed_amount !== null ? `$${Number(r.parsed_amount).toFixed(2)}` : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {r.is_valid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-sm font-semibold">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-sm font-semibold">
                                  {r.validation_error || 'Invalid'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary px-4 py-2.5 text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={loading || preview.valid_count === 0}
              className="btn-black px-6 py-2.5 text-xs flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <span>{loading ? 'Importing Rows...' : `Confirm Import (${preview.valid_count} Rows)`}</span>
              <ArrowRight className="w-4 h-4 text-[#FF6908]" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {step === 3 && importResult && (
        <div className="elevate-card p-10 bg-white text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-50 text-[#287650] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#111111]">Import Successfully Committed</h2>
          <p className="text-sm text-[#706F6A] max-w-md mx-auto">
            Successfully imported <strong className="text-[#111111]">{importResult.imported_rows}</strong> transactions into your ledger.
            {importResult.skipped_rows > 0 && ` (${importResult.skipped_rows} invalid rows skipped)`}.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setPreview(null);
              }}
              className="btn-secondary px-5 py-2.5 text-xs font-medium"
            >
              Import Another File
            </button>
            <button
              onClick={onImportComplete}
              className="btn-black px-6 py-2.5 text-xs font-medium flex items-center gap-2"
            >
              <span>View Transactions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
