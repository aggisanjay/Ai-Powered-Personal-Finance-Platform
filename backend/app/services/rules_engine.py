import re
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models import CategorizationRule

def apply_categorization_rules(
    db: Session,
    user_id: int,
    description: str,
    merchant: Optional[str] = None
) -> Optional[int]:
    """
    Evaluates user rules in priority order (lowest priority number = first).
    Returns target_category_id if a matching rule is triggered, or None.
    """
    rules = (
        db.query(CategorizationRule)
        .filter(CategorizationRule.user_id == user_id, CategorizationRule.is_active == True)
        .order_by(CategorizationRule.priority.asc(), CategorizationRule.id.asc())
        .all()
    )

    clean_desc = (description or "").strip()
    clean_merchant = (merchant or "").strip()

    for rule in rules:
        target_text = clean_merchant if rule.field_to_match == "merchant" else clean_desc
        if not target_text:
            continue

        try:
            # Compiled regex search (case-insensitive)
            if re.search(rule.pattern, target_text, re.IGNORECASE):
                return rule.target_category_id
        except re.error:
            # Fallback to simple literal substring search if pattern is not valid regex
            if rule.pattern.lower() in target_text.lower():
                return rule.target_category_id

    return None
