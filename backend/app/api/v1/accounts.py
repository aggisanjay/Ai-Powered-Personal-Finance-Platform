from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, FinancialAccount
from backend.app.schemas import AccountCreate, AccountResponse

router = APIRouter(prefix="/accounts", tags=["Financial Accounts"])

@router.get("", response_model=List[AccountResponse])
def list_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(FinancialAccount).filter(FinancialAccount.user_id == current_user.id).all()

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(account_in: AccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = FinancialAccount(
        user_id=current_user.id,
        name=account_in.name,
        institution=account_in.institution,
        account_type=account_in.account_type,
        default_currency=account_in.default_currency,
        balance=account_in.balance
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account
