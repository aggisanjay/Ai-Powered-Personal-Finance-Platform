from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, CategorizationRule, Transaction
from backend.app.schemas import RuleCreate, RuleUpdate, RuleResponse
from backend.app.services.rules_engine import apply_categorization_rules

router = APIRouter(prefix="/categorization-rules", tags=["Categorization Rules"])

@router.get("", response_model=List[RuleResponse])
def list_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CategorizationRule).filter(
        CategorizationRule.user_id == current_user.id
    ).order_by(CategorizationRule.priority.asc(), CategorizationRule.id.asc()).all()

@router.post("", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(rule_in: RuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = CategorizationRule(
        user_id=current_user.id,
        name=rule_in.name,
        pattern=rule_in.pattern,
        field_to_match=rule_in.field_to_match,
        target_category_id=rule_in.target_category_id,
        priority=rule_in.priority,
        is_active=rule_in.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, rule_in: RuleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.query(CategorizationRule).filter(
        CategorizationRule.id == rule_id,
        CategorizationRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    if rule_in.name is not None:
        rule.name = rule_in.name
    if rule_in.pattern is not None:
        rule.pattern = rule_in.pattern
    if rule_in.field_to_match is not None:
        rule.field_to_match = rule_in.field_to_match
    if rule_in.target_category_id is not None:
        rule.target_category_id = rule_in.target_category_id
    if rule_in.priority is not None:
        rule.priority = rule_in.priority
    if rule_in.is_active is not None:
        rule.is_active = rule_in.is_active

    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.query(CategorizationRule).filter(
        CategorizationRule.id == rule_id,
        CategorizationRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return None

@router.post("/reprocess")
def reprocess_unassigned_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Applies active rules to all unassigned transactions."""
    unassigned = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category_id == None
    ).all()

    reclassified_count = 0
    for t in unassigned:
        cat_id = apply_categorization_rules(db, current_user.id, t.description, t.merchant)
        if cat_id:
            t.category_id = cat_id
            t.categorization_method = "rule"
            reclassified_count += 1

    db.commit()
    return {"message": f"Successfully reprocessed and categorized {reclassified_count} transaction(s)."}
