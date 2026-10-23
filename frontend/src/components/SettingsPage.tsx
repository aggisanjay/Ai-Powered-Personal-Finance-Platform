import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { AuditEvent } from '../types';
import {
  ShieldCheck, Download, Trash2, Clock, User, Lock, AlertTriangle, AlertCircle, CheckCircle2, FileText
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoadingAudit(true);
    try {
      const data = await api.getAuditLog();
      setAuditEvents(data);
    } catch (err: any) {
      console.error('Failed to load audit log:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const blob = await api.downloadExportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${user?.id || 'data'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({
        text: 'Sanitized CSV exported successfully (formula injection shielded with single-quote escaping).',
        type: 'success',
      });
      loadAudit();
    } catch (err: any) {
      setMessage({ text: err.message || 'Export failed', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.deleteAccount();
      logout();
    } catch (err: any) {
      setMessage({ text: err.message || 'Account deletion failed', type: 'error' });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
          Settings, Audit & Data Privacy
        </h1>
        <p className="text-sm text-[#706F6A] mt-1">
          Review your account profile, inspect processing audit events, export sanitized records, or delete your account.
        </p>
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

      {/* Profile Card */}
      <div className="elevate-card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E9E1D5]">
          <div className="w-10 h-10 rounded-xl bg-[#FFF0E2] text-[#FF6908] flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#111111]">User Account Profile</h2>
            <p className="text-xs text-[#706F6A]">Ownership isolation enforced across all database queries.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E9E1D5]">
            <p className="text-xs font-medium text-[#706F6A]">Full Name</p>
            <p className="text-sm font-semibold text-[#111111] mt-1">{user?.full_name || 'Not specified'}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E9E1D5]">
            <p className="text-xs font-medium text-[#706F6A]">Email Address</p>
            <p className="text-sm font-semibold text-[#111111] mt-1">{user?.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E9E1D5]">
            <p className="text-xs font-medium text-[#706F6A]">Default Currency</p>
            <p className="text-sm font-semibold text-[#111111] mt-1">{user?.currency_code || 'USD'}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E9E1D5]">
            <p className="text-xs font-medium text-[#706F6A]">Account Status</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#287650]/10 text-[#287650] mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#287650]" />
              {user?.status?.toUpperCase() || 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Export & Privacy Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="elevate-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-[#FF6908]" />
              <h2 className="text-base font-semibold text-[#111111]">Sanitized CSV Data Export</h2>
            </div>
            <p className="text-xs text-[#706F6A] leading-relaxed mb-4">
              Download all your stored financial transactions in CSV format. Special spreadsheet characters
              (=, +, -, @) are sanitized with prefix apostrophes to prevent CSV formula injection exploits.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="btn-black w-full py-3 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating Export...' : 'Download My Transactions (.CSV)'}</span>
          </button>
        </div>

        <div className="elevate-card p-6 flex flex-col justify-between border-[#B83D35]/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-[#B83D35]" />
              <h2 className="text-base font-semibold text-[#B83D35]">Permanent Account Deletion</h2>
            </div>
            <p className="text-xs text-[#706F6A] leading-relaxed mb-4">
              Irreversible action. Permanently deletes your account, bank accounts, transactions,
              categories, budgets, categorization rules, receipts, and audit trail records.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 text-sm font-medium rounded-xl border border-[#B83D35]/40 text-[#B83D35] hover:bg-[#B83D35]/10 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account & Purge Data</span>
          </button>
        </div>
      </div>

      {/* Security Principles & Compliance Guarantees */}
      <div className="elevate-card p-6 bg-[#FFFDF9]">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#287650]" />
          <h2 className="text-base font-semibold text-[#111111]">Security & Architecture Principles</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#706F6A]">
          <div className="p-3 rounded-xl bg-white border border-[#E9E1D5]">
            <p className="font-semibold text-[#111111] mb-1">Zero Bank Credentials</p>
            <p>We never request, store, or transmit your online banking passwords or access tokens.</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E9E1D5]">
            <p className="font-semibold text-[#111111] mb-1">Deterministic Arithmetic</p>
            <p>All sums, totals, budgets, and net cash flows are computed via Decimal math, never estimated by LLMs.</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E9E1D5]">
            <p className="font-semibold text-[#111111] mb-1">Multi-Tenant Isolation</p>
            <p>Backend queries strictly enforce user_id scoping on every single data operation.</p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="elevate-card overflow-hidden">
        <div className="p-6 border-b border-[#E9E1D5] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6908]" />
            <h2 className="text-base font-semibold text-[#111111]">Audit Trail History</h2>
          </div>
          <span className="text-xs text-[#706F6A]">
            Showing recent processing actions and data events
          </span>
        </div>

        {loadingAudit ? (
          <div className="p-12 text-center text-sm text-[#706F6A]">Loading audit log...</div>
        ) : auditEvents.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#706F6A]">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#111111]">
              <thead className="bg-[#FAF7F0] border-b border-[#E9E1D5] text-xs font-semibold text-[#706F6A] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Target Entity</th>
                  <th className="py-3 px-6">Entity ID</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D5]/60">
                {auditEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-[#FFFDF9] transition-colors">
                    <td className="py-3.5 px-6 font-mono text-xs text-[#706F6A]">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-xs text-[#111111]">
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF0E2] text-[#FF6908] border border-[#FF6908]/20">
                        {event.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-[#706F6A]">{event.resource_type}</td>
                    <td className="py-3.5 px-6 font-mono text-xs text-[#706F6A]">
                      {event.resource_id || '—'}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-[#706F6A] truncate max-w-xs">
                      {event.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#B83D35]/40 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-[#B83D35]/10 text-[#B83D35] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-[#111111] mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-center text-[#706F6A] leading-relaxed mb-6">
              This action is permanent and cannot be undone. All financial records, accounts,
              imports, categorization rules, and transactions associated with <strong>{user?.email}</strong> will be permanently wiped from the database.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#111111] mb-2 text-center">
                Type <span className="font-mono text-[#B83D35]">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full text-center tracking-widest font-mono px-3 py-2 text-sm rounded-xl border border-[#E9E1D5] focus:outline-hidden focus:border-[#B83D35]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="btn-secondary flex-1 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-[#B83D35] text-white hover:bg-[#9E342D] disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
