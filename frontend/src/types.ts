export interface User {
  id: number;
  email: string;
  full_name: string | null;
  currency_code: string;
  status: string;
  created_at: string;
}

export interface FinancialAccount {
  id: number;
  user_id: number;
  name: string;
  institution: string | null;
  account_type: string;
  default_currency: string;
  balance: number;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  color: string;
  icon: string;
  is_income: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number | null;
  import_batch_id: number | null;
  transaction_date: string;
  posted_date: string | null;
  description: string;
  merchant: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  categorization_method: string;
  categorization_confidence: number | null;
  review_status: string;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CategorizationRule {
  id: number;
  user_id: number;
  name: string;
  pattern: string;
  field_to_match: string;
  target_category_id: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  target_category?: Category;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  period_month: string;
  amount: number;
  created_at: string;
  category?: Category;
}

export interface BudgetComparisonItem {
  budget_id: number | null;
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  budgeted_amount: number;
  actual_spent: number;
  remaining_amount: number;
  utilization_percentage: number;
  is_over_budget: boolean;
}

export interface BudgetComparisonResponse {
  period_month: string;
  total_budgeted: number;
  total_actual: number;
  overall_utilization_percentage: number;
  items: BudgetComparisonItem[];
}

export interface MonthlySummary {
  period_month: string;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  savings_rate: number;
  transaction_count: number;
  previous_period_month: string | null;
  previous_income: number | null;
  previous_expenses: number | null;
  mom_expense_change_amount: number | null;
  mom_expense_change_percent: number | null;
}

export interface CategorySpendingItem {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  amount: number;
  percentage: number;
  transaction_count: number;
  previous_amount: number | null;
  mom_change_amount: number | null;
  mom_change_percent: number | null;
}

export interface CategoryTrendsResponse {
  period_month: string;
  categories: CategorySpendingItem[];
  largest_increase: CategorySpendingItem | null;
  largest_decrease: CategorySpendingItem | null;
}

export interface RecurringCandidate {
  id: number;
  merchant: string;
  amount: number;
  currency: string;
  interval_days: number;
  last_payment_date: string;
  occurrences_count: number;
  confidence: number;
  status: string;
}

export interface DuplicateCandidate {
  id: number;
  primary_transaction_id: number;
  duplicate_transaction_id: number;
  similarity_score: number;
  reason: string;
  status: string;
}

export interface Receipt {
  id: number;
  transaction_id: number | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  ocr_status: string;
  raw_ocr_text: string | null;
  extracted_merchant: string | null;
  extracted_date: string | null;
  extracted_total: number | null;
  extracted_tax: number | null;
  extracted_currency: string | null;
  created_at: string;
}

export interface SupportingTransaction {
  id: number;
  transaction_date: string;
  merchant: string | null;
  description: string;
  amount: number;
  category_name: string | null;
}

export interface AssistantResponse {
  question: string;
  computed_facts: Record<string, any>;
  explanation: string;
  supporting_transactions: SupportingTransaction[];
  date_range_applied: string;
  confidence_note: string;
  latency_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost_usd?: number | string;
  model_source?: string;
}

export interface AuditEvent {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  timestamp: string;
}

export interface ColumnMapping {
  date_col: string;
  description_col: string;
  amount_col?: string | null;
  debit_col?: string | null;
  credit_col?: string | null;
  merchant_col?: string | null;
  currency_col?: string | null;
  date_format?: string | null;
}

export interface CSVPreviewRow {
  row_number: number;
  raw_data: Record<string, any>;
  parsed_date: string | null;
  parsed_description: string | null;
  parsed_merchant: string | null;
  parsed_amount: number | null;
  is_valid: boolean;
  validation_error: string | null;
}

export interface CSVPreviewResponse {
  filename: string;
  total_detected_rows: number;
  available_columns: string[];
  suggested_mapping: ColumnMapping;
  sample_rows: CSVPreviewRow[];
  valid_count: number;
  invalid_count: number;
}
