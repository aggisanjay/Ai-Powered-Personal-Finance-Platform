from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Numeric, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    currency_code = Column(String(3), default="USD", nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    accounts = relationship("FinancialAccount", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    rules = relationship("CategorizationRule", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    import_batches = relationship("ImportBatch", back_populates="user", cascade="all, delete-orphan")
    receipts = relationship("Receipt", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="user", cascade="all, delete-orphan")

class FinancialAccount(Base):
    __tablename__ = "financial_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    institution = Column(String(100), nullable=True)
    account_type = Column(String(50), default="checking", nullable=False) # checking, credit, savings, investment
    default_currency = Column(String(3), default="USD", nullable=False)
    balance = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True) # None = global system category
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#706F6A", nullable=False)
    icon = Column(String(50), default="Tag", nullable=False)
    is_income = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    rules = relationship("CategorizationRule", back_populates="target_category")
    budgets = relationship("Budget", back_populates="category")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    import_batch_id = Column(Integer, ForeignKey("import_batches.id", ondelete="SET NULL"), nullable=True, index=True)

    transaction_date = Column(Date, nullable=False, index=True)
    posted_date = Column(Date, nullable=True)
    description = Column(String(500), nullable=False)
    merchant = Column(String(255), nullable=True, index=True)
    amount = Column(Numeric(14, 2), nullable=False) # Negative = Expense, Positive = Income
    currency = Column(String(3), default="USD", nullable=False)
    transaction_type = Column(String(50), default="expense", nullable=False) # expense, income, transfer
    
    categorization_method = Column(String(50), default="unassigned", nullable=False) # rule, ai, manual, unassigned
    categorization_confidence = Column(Numeric(5, 4), nullable=True) # 0.0 to 1.0
    review_status = Column(String(50), default="confirmed", nullable=False) # confirmed, pending_review, rejected
    external_id = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="transactions")
    account = relationship("FinancialAccount", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    import_batch = relationship("ImportBatch", back_populates="transactions")
    receipts = relationship("Receipt", back_populates="transaction")

    __table_args__ = (
        Index("idx_user_date", "user_id", "transaction_date"),
        Index("idx_user_category", "user_id", "category_id"),
    )

class CategorizationRule(Base):
    __tablename__ = "categorization_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    pattern = Column(String(255), nullable=False) # regex pattern or substring
    field_to_match = Column(String(50), default="description", nullable=False) # description, merchant
    target_category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, default=10, nullable=False) # lower number = higher priority
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="rules")
    target_category = relationship("Category", back_populates="rules")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    period_month = Column(String(7), nullable=False, index=True) # YYYY-MM
    amount = Column(Numeric(14, 2), nullable=False) # Monthly limit
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    imported_rows = Column(Integer, default=0, nullable=False)
    skipped_rows = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, success, partial, failed
    error_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="import_batches")
    transactions = relationship("Transaction", back_populates="import_batch")

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    ocr_status = Column(String(50), default="pending", nullable=False) # pending, completed, failed, unconfigured
    raw_ocr_text = Column(Text, nullable=True)
    
    extracted_merchant = Column(String(255), nullable=True)
    extracted_date = Column(Date, nullable=True)
    extracted_total = Column(Numeric(14, 2), nullable=True)
    extracted_tax = Column(Numeric(14, 2), nullable=True)
    extracted_currency = Column(String(3), default="USD", nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="receipts")
    transaction = relationship("Transaction", back_populates="receipts")

class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant = Column(String(255), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    interval_days = Column(Integer, default=30, nullable=False) # approximate recurrence
    last_payment_date = Column(Date, nullable=False)
    occurrences_count = Column(Integer, default=2, nullable=False)
    confidence = Column(Numeric(5, 4), default=Decimal("0.8500"), nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, confirmed, paused, dismissed
    created_at = Column(DateTime, default=utc_now, nullable=False)

class DuplicateCandidate(Base):
    __tablename__ = "duplicate_candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    primary_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    duplicate_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Numeric(5, 4), nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="detected", nullable=False) # detected, confirmed_duplicate, resolved_distinct
    created_at = Column(DateTime, default=utc_now, nullable=False)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False) # IMPORT_CSV, UPDATE_CATEGORY, EXPORT_DATA, DELETE_ACCOUNT, OCR_RECEIPT
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True) # Sanitized audit summary (no passwords or sensitive data)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="audit_events")
