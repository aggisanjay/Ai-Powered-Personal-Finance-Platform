from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    currency_code: str = Field(default="USD", max_length=3)

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Account Schemas ---
class AccountCreate(BaseModel):
    name: str = Field(max_length=100)
    institution: Optional[str] = Field(default=None, max_length=100)
    account_type: str = Field(default="checking")
    default_currency: str = Field(default="USD", max_length=3)
    balance: Decimal = Decimal("0.00")

class AccountResponse(AccountCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str = Field(max_length=100)
    color: str = Field(default="#706F6A", max_length=20)
    icon: str = Field(default="Tag", max_length=50)
    is_income: bool = False

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_income: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    transaction_date: date
    posted_date: Optional[date] = None
    description: str = Field(max_length=500)
    merchant: Optional[str] = Field(default=None, max_length=255)
    amount: Decimal # Negative for expense, positive for income
    currency: str = Field(default="USD", max_length=3)
    transaction_type: str = Field(default="expense")
    review_status: str = Field(default="confirmed")
    external_id: Optional[str] = None

class TransactionCreate(TransactionBase):
    categorization_method: str = "manual"
    categorization_confidence: Optional[Decimal] = None

class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    amount: Optional[Decimal] = None
    transaction_date: Optional[date] = None
    review_status: Optional[str] = None
    categorization_method: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    import_batch_id: Optional[int] = None
    categorization_method: str
    categorization_confidence: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# --- Rule Schemas ---
class RuleCreate(BaseModel):
    name: str = Field(max_length=100)
    pattern: str = Field(max_length=255)
    field_to_match: str = Field(default="description") # description or merchant
    target_category_id: int
    priority: int = 10
    is_active: bool = True

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    pattern: Optional[str] = None
    field_to_match: Optional[str] = None
    target_category_id: Optional[int] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class RuleResponse(RuleCreate):
    id: int
    user_id: int
    created_at: datetime
    target_category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# --- Budget Schemas ---
class BudgetCreate(BaseModel):
    category_id: int
    period_month: str = Field(pattern=r"^\d{4}-\d{2}$") # YYYY-MM
    amount: Decimal = Field(gt=0)

class BudgetUpdate(BaseModel):
    amount: Decimal = Field(gt=0)

class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    period_month: str
    amount: Decimal
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class BudgetComparisonItem(BaseModel):
    budget_id: Optional[int] = None
    category_id: int
    category_name: str
    category_color: str
    category_icon: str
    budgeted_amount: Decimal
    actual_spent: Decimal
    remaining_amount: Decimal
    utilization_percentage: Decimal
    is_over_budget: bool

class BudgetComparisonResponse(BaseModel):
    period_month: str
    total_budgeted: Decimal
    total_actual: Decimal
    overall_utilization_percentage: Decimal
    items: List[BudgetComparisonItem]

# --- Ingestion & CSV Schemas ---
class ColumnMapping(BaseModel):
    date_col: str
    description_col: str
    amount_col: Optional[str] = None
    debit_col: Optional[str] = None
    credit_col: Optional[str] = None
    merchant_col: Optional[str] = None
    currency_col: Optional[str] = None
    external_id_col: Optional[str] = None
    date_format: Optional[str] = None # e.g. %Y-%m-%d or %m/%d/%Y

class CSVPreviewRow(BaseModel):
    row_number: int
    raw_data: Dict[str, Any]
    parsed_date: Optional[date] = None
    parsed_description: Optional[str] = None
    parsed_merchant: Optional[str] = None
    parsed_amount: Optional[Decimal] = None
    is_valid: bool = True
    validation_error: Optional[str] = None
    is_potential_duplicate: bool = False

class CSVPreviewResponse(BaseModel):
    filename: str
    total_detected_rows: int
    available_columns: List[str]
    suggested_mapping: ColumnMapping
    sample_rows: List[CSVPreviewRow]
    valid_count: int
    invalid_count: int

class CSVImportConfirmRequest(BaseModel):
    account_id: int
    filename: str
    mapping: ColumnMapping
    apply_rules: bool = True

class ImportBatchResponse(BaseModel):
    id: int
    filename: str
    total_rows: int
    imported_rows: int
    skipped_rows: int
    status: str
    error_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Receipt Schemas ---
class ReceiptResponse(BaseModel):
    id: int
    transaction_id: Optional[int] = None
    file_name: str
    file_size_bytes: int
    mime_type: str
    ocr_status: str
    raw_ocr_text: Optional[str] = None
    extracted_merchant: Optional[str] = None
    extracted_date: Optional[date] = None
    extracted_total: Optional[Decimal] = None
    extracted_tax: Optional[Decimal] = None
    extracted_currency: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReceiptConfirmRequest(BaseModel):
    receipt_id: int
    account_id: int
    category_id: Optional[int] = None
    merchant: str
    transaction_date: date
    total_amount: Decimal
    currency: str = "USD"
    notes: Optional[str] = None

# --- Analytics Schemas ---
class MonthlySummaryResponse(BaseModel):
    period_month: str
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    savings_rate: Decimal # (income - expenses) / income * 100
    transaction_count: int
    previous_period_month: Optional[str] = None
    previous_income: Optional[Decimal] = None
    previous_expenses: Optional[Decimal] = None
    mom_expense_change_amount: Optional[Decimal] = None
    mom_expense_change_percent: Optional[Decimal] = None

class CategorySpendingItem(BaseModel):
    category_id: int
    category_name: str
    category_color: str
    category_icon: str
    amount: Decimal
    percentage: Decimal
    transaction_count: int
    previous_amount: Optional[Decimal] = None
    mom_change_amount: Optional[Decimal] = None
    mom_change_percent: Optional[Decimal] = None

class CategoryTrendsResponse(BaseModel):
    period_month: str
    categories: List[CategorySpendingItem]
    largest_increase: Optional[CategorySpendingItem] = None
    largest_decrease: Optional[CategorySpendingItem] = None

class RecurringCandidateResponse(BaseModel):
    id: int
    merchant: str
    amount: Decimal
    currency: str
    interval_days: int
    last_payment_date: date
    occurrences_count: int
    confidence: Decimal
    status: str

    class Config:
        from_attributes = True

class DuplicateCandidateResponse(BaseModel):
    id: int
    primary_transaction_id: int
    duplicate_transaction_id: int
    similarity_score: Decimal
    reason: str
    status: str
    primary_transaction: Optional[TransactionResponse] = None
    duplicate_transaction: Optional[TransactionResponse] = None

    class Config:
        from_attributes = True

# --- AI Assistant & Audit Schemas ---
class SupportingTransaction(BaseModel):
    id: int
    transaction_date: date
    merchant: Optional[str]
    description: str
    amount: Decimal
    category_name: Optional[str]

class AssistantQueryRequest(BaseModel):
    question: str
    account_id: Optional[int] = None
    period_month: Optional[str] = None # Optional YYYY-MM context

class AssistantQueryResponse(BaseModel):
    question: str
    computed_facts: Dict[str, Any]
    explanation: str
    supporting_transactions: List[SupportingTransaction]
    date_range_applied: str
    confidence_note: str
    latency_ms: Optional[int] = 0
    prompt_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0
    total_tokens: Optional[int] = 0
    cost_usd: Optional[Decimal] = Decimal("0.000000")
    model_source: Optional[str] = "Grounded Financial AI Engine"

class AuditEventResponse(BaseModel):
    id: int
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
