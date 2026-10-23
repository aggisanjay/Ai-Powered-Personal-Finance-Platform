from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, DuplicateCandidate, Transaction
from backend.app.schemas import (
    MonthlySummaryResponse, CategoryTrendsResponse,
    RecurringCandidateResponse, DuplicateCandidateResponse
)
from backend.app.analytics.calculator import (
    calculate_monthly_summary, calculate_category_trends,
    detect_recurring_expenses, detect_duplicate_candidates
)

router = APIRouter(prefix="/analytics", tags=["Financial Analytics"])

@router.get("/monthly-summary", response_model=MonthlySummaryResponse)
def get_monthly_summary(
    period_month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    account_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not period_month:
        today = date.today()
        period_month = f"{today.year}-{today.month:02d}"
    return calculate_monthly_summary(db, current_user.id, period_month, account_id)

@router.get("/category-trends", response_model=CategoryTrendsResponse)
def get_category_trends(
    period_month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not period_month:
        today = date.today()
        period_month = f"{today.year}-{today.month:02d}"
    return calculate_category_trends(db, current_user.id, period_month)

@router.get("/recurring-expenses", response_model=List[RecurringCandidateResponse])
def get_recurring_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return detect_recurring_expenses(db, current_user.id)

@router.get("/duplicates", response_model=List[DuplicateCandidateResponse])
def get_duplicate_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return detect_duplicate_candidates(db, current_user.id)

@router.post("/duplicates/{candidate_id}/resolve")
def resolve_duplicate(
    candidate_id: int,
    action: str = Query(..., pattern=r"^(confirm_duplicate|keep_both)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cand = db.query(DuplicateCandidate).filter(
        DuplicateCandidate.id == candidate_id,
        DuplicateCandidate.user_id == current_user.id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Duplicate candidate not found")

    if action == "confirm_duplicate":
        cand.status = "confirmed_duplicate"
        # Mark secondary transaction as rejected
        sec_tx = db.query(Transaction).filter(
            Transaction.id == cand.duplicate_transaction_id,
            Transaction.user_id == current_user.id
        ).first()
        if sec_tx:
            sec_tx.review_status = "rejected"
            if sec_tx.account:
                sec_tx.account.balance -= sec_tx.amount # revert balance impact
    else:
        cand.status = "resolved_distinct"

    db.commit()
    return {"message": f"Candidate resolved as {action}."}
