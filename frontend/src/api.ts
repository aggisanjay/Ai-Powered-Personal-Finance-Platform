import {
  User, FinancialAccount, Category, Transaction,
  CategorizationRule, Budget, BudgetComparisonResponse,
  MonthlySummary, CategoryTrendsResponse, RecurringCandidate,
  DuplicateCandidate, Receipt, AssistantResponse, AuditEvent,
  CSVPreviewResponse
} from './types';

let rawApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
if (rawApiUrl) {
  // Auto-correct common typo where user enters 'https//' instead of 'https://'
  if (rawApiUrl.startsWith('https//')) {
    rawApiUrl = rawApiUrl.replace('https//', 'https://');
  } else if (rawApiUrl.startsWith('http//')) {
    rawApiUrl = rawApiUrl.replace('http//', 'http://');
  } else if (!rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
    rawApiUrl = `https://${rawApiUrl}`;
  }
}
const API_BASE = rawApiUrl ? `${rawApiUrl.replace(/\/+$/, '')}/api/v1` : '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = 'An error occurred';
    try {
      const data = await res.json();
      errMessage = data.detail || errMessage;
    } catch {
      errMessage = res.statusText || errMessage;
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data: any): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(creds: { email: string; password: string }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Accounts
  async getAccounts(): Promise<FinancialAccount[]> {
    const res = await fetch(`${API_BASE}/accounts`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async createAccount(data: Partial<FinancialAccount>): Promise<FinancialAccount> {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Transactions
  async getTransactions(params?: {
    account_id?: number;
    category_id?: number;
    search?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    const url = new URL(`${window.location.origin}${API_BASE}/transactions`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.append(k, String(v));
        }
      });
    }
    const res = await fetch(url.toString(), { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async createTransaction(data: any): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteTransaction(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  // Rules
  async getRules(): Promise<CategorizationRule[]> {
    const res = await fetch(`${API_BASE}/categorization-rules`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async createRule(data: Partial<CategorizationRule>): Promise<CategorizationRule> {
    const res = await fetch(`${API_BASE}/categorization-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteRule(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/categorization-rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete rule');
  },

  async reprocessRules(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/categorization-rules/reprocess`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Budgets
  async getBudgetComparison(periodMonth: string): Promise<BudgetComparisonResponse> {
    const res = await fetch(`${API_BASE}/budgets/comparison?period_month=${periodMonth}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async setBudget(data: { category_id: number; period_month: string; amount: number }): Promise<Budget> {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteBudget(budgetId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/budgets/${budgetId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete budget');
  },

  // Analytics
  async getMonthlySummary(periodMonth?: string): Promise<MonthlySummary> {
    const q = periodMonth ? `?period_month=${periodMonth}` : '';
    const res = await fetch(`${API_BASE}/analytics/monthly-summary${q}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async getCategoryTrends(periodMonth?: string): Promise<CategoryTrendsResponse> {
    const q = periodMonth ? `?period_month=${periodMonth}` : '';
    const res = await fetch(`${API_BASE}/analytics/category-trends${q}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async getRecurringExpenses(): Promise<RecurringCandidate[]> {
    const res = await fetch(`${API_BASE}/analytics/recurring-expenses`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async getDuplicates(): Promise<DuplicateCandidate[]> {
    const res = await fetch(`${API_BASE}/analytics/duplicates`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async resolveDuplicate(id: number, action: 'confirm_duplicate' | 'keep_both'): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/duplicates/${id}/resolve?action=${action}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Imports
  async previewCSV(file: File): Promise<CSVPreviewResponse> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/imports/preview`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: form,
    });
    return handleResponse(res);
  },

  async confirmImport(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/imports/confirm`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    return handleResponse(res);
  },

  // Receipts
  async uploadReceipt(file: File): Promise<Receipt> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/receipts/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: form,
    });
    return handleResponse(res);
  },

  async getReceipts(): Promise<Receipt[]> {
    const res = await fetch(`${API_BASE}/receipts`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async confirmReceiptTransaction(data: any): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/receipts/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Assistant
  async askAssistant(question: string, periodMonth?: string): Promise<AssistantResponse> {
    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ question, period_month: periodMonth }),
    });
    return handleResponse(res);
  },

  // Settings
  async getAuditLog(): Promise<AuditEvent[]> {
    const res = await fetch(`${API_BASE}/settings/audit-events`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async downloadExportCSV(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/settings/export/csv`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to export CSV');
    return res.blob();
  },

  async deleteAccount(): Promise<void> {
    const res = await fetch(`${API_BASE}/settings/account`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete account');
  },
};
