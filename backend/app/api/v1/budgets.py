from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, Budget, Category
from backend.app.schemas import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetComparisonResponse
from backend.app.analytics.calculator import calculate_budget_comparisons

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    period_month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.period_month == period_month
    ).all()

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_budget(
    b_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify category exists
    cat = db.query(Category).filter(Category.id == b_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if budget already exists for this month/category -> update if so
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == b_in.category_id,
        Budget.period_month == b_in.period_month
    ).first()

    if budget:
        budget.amount = b_in.amount
    else:
        budget = Budget(
            user_id=current_user.id,
            category_id=b_in.category_id,
            period_month=b_in.period_month,
            amount=b_in.amount
        )
        db.add(budget)

    db.commit()
    db.refresh(budget)
    return budget

@router.get("/comparison", response_model=BudgetComparisonResponse)
def get_budget_comparison(
    period_month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return calculate_budget_comparisons(db, current_user.id, period_month)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget entry not found")
    db.delete(budget)
    db.commit()
    return None
