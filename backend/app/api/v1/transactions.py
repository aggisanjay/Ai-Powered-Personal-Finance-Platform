from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, Transaction, FinancialAccount, Category
from backend.app.schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from backend.app.services.rules_engine import apply_categorization_rules
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    account_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if review_status:
        query = query.filter(Transaction.review_status == review_status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(
            Transaction.description.ilike(term),
            Transaction.merchant.ilike(term)
        ))

    return query.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify account ownership
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == tx_in.account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or access denied")

    category_id = tx_in.category_id
    cat_method = tx_in.categorization_method
    if not category_id:
        auto_cat = apply_categorization_rules(db, current_user.id, tx_in.description, tx_in.merchant)
        if auto_cat:
            category_id = auto_cat
            cat_method = "rule"

    transaction = Transaction(
        user_id=current_user.id,
        account_id=tx_in.account_id,
        category_id=category_id,
        transaction_date=tx_in.transaction_date,
        posted_date=tx_in.posted_date,
        description=tx_in.description,
        merchant=tx_in.merchant,
        amount=tx_in.amount,
        currency=tx_in.currency,
        transaction_type=tx_in.transaction_type,
        categorization_method=cat_method,
        categorization_confidence=tx_in.categorization_confidence or Decimal("1.0"),
        review_status=tx_in.review_status,
        external_id=tx_in.external_id
    )
    db.add(transaction)
    
    # Update account balance
    account.balance += tx_in.amount
    
    db.commit()
    db.refresh(transaction)
    return transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    tx_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx_update.category_id is not None:
        tx.category_id = tx_update.category_id
        tx.categorization_method = "manual"
    if tx_update.description is not None:
        tx.description = tx_update.description
    if tx_update.merchant is not None:
        tx.merchant = tx_update.merchant
    if tx_update.transaction_date is not None:
        tx.transaction_date = tx_update.transaction_date
    if tx_update.review_status is not None:
        tx.review_status = tx_update.review_status
    if tx_update.amount is not None:
        diff = tx_update.amount - tx.amount
        tx.amount = tx_update.amount
        if tx.account:
            tx.account.balance += diff

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx.account:
        tx.account.balance -= tx.amount

    db.delete(tx)
    db.commit()
    return None
