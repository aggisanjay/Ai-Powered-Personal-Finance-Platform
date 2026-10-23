from decimal import Decimal
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.models import User, FinancialAccount, Category, CategorizationRule
from backend.app.schemas import UserCreate, UserLogin, Token, UserResponse
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.services.audit_service import log_audit_event

DEFAULT_CATEGORIES = [
    {"name": "Groceries", "color": "#16A34A", "icon": "ShoppingCart", "is_income": False},
    {"name": "Housing & Rent", "color": "#2563EB", "icon": "Home", "is_income": False},
    {"name": "Dining & Cafes", "color": "#EA580C", "icon": "Utensils", "is_income": False},
    {"name": "Transport & Fuel", "color": "#D97706", "icon": "Car", "is_income": False},
    {"name": "Utilities & Bills", "color": "#0284C7", "icon": "Zap", "is_income": False},
    {"name": "Health & Medical", "color": "#DC2626", "icon": "Activity", "is_income": False},
    {"name": "Entertainment", "color": "#9333EA", "icon": "Film", "is_income": False},
    {"name": "Shopping", "color": "#DB2777", "icon": "ShoppingBag", "is_income": False},
    {"name": "Subscriptions", "color": "#4F46E5", "icon": "Repeat", "is_income": False},
    {"name": "Salary & Income", "color": "#059669", "icon": "DollarSign", "is_income": True},
    {"name": "Investments", "color": "#0D9488", "icon": "TrendingUp", "is_income": True},
    {"name": "Other Expenses", "color": "#6B7280", "icon": "Tag", "is_income": False},
]

DEFAULT_RULES = [
    {"name": "Grocery Stores", "pattern": "supermarket|walmart|kroger|trader joe|whole foods|costco|safeway", "field": "merchant", "category": "Groceries"},
    {"name": "Fuel & Gas", "pattern": "chevron|shell|exxon|bp|gas station|speedway", "field": "merchant", "category": "Transport & Fuel"},
    {"name": "Dining & Fast Food", "pattern": "starbucks|mcdonald|chipotle|uber eats|doordash|restaurant|cafe", "field": "merchant", "category": "Dining & Cafes"},
    {"name": "Utilities", "pattern": "electric|water|energy|power|internet|comcast|at&t|verizon", "field": "description", "category": "Utilities & Bills"},
    {"name": "Subscriptions", "pattern": "netflix|spotify|apple|disney|hulu|prime|youtube|github", "field": "merchant", "category": "Subscriptions"},
    {"name": "Salary", "pattern": "payroll|direct deposit|salary|employer", "field": "description", "category": "Salary & Income"},
]

def register_user(db: Session, user_in: UserCreate, client_ip: Optional[str] = None) -> Token:
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=user_in.email.lower().strip(),
        password_hash=hash_password(user_in.password),
        full_name=user_in.full_name or user_in.email.split("@")[0].capitalize(),
        currency_code=user_in.currency_code.upper(),
        status="active"
    )
    db.add(user)
    db.flush() # populate user.id

    # Create default Checking Account
    default_account = FinancialAccount(
        user_id=user.id,
        name="Primary Checking",
        institution="Main Bank",
        account_type="checking",
        default_currency=user.currency_code,
        balance=Decimal("0.00")
    )
    db.add(default_account)

    # Seed default categories and default rules
    cat_map = {}
    for cat_data in DEFAULT_CATEGORIES:
        cat = Category(
            user_id=user.id,
            name=cat_data["name"],
            color=cat_data["color"],
            icon=cat_data["icon"],
            is_income=cat_data["is_income"]
        )
        db.add(cat)
        db.flush()
        cat_map[cat.name] = cat.id

    for r in DEFAULT_RULES:
        if r["category"] in cat_map:
            rule = CategorizationRule(
                user_id=user.id,
                name=r["name"],
                pattern=r["pattern"],
                field_to_match=r["field"],
                target_category_id=cat_map[r["category"]],
                priority=10,
                is_active=True
            )
            db.add(rule)

    db.commit()
    db.refresh(user)

    log_audit_event(
        db, user.id, "REGISTER", "User", str(user.id),
        details="Account created with default accounts and categories",
        ip_address=client_ip
    )

    access_token = create_access_token(subject=str(user.id))
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

def authenticate_user(db: Session, creds: UserLogin, client_ip: Optional[str] = None) -> Token:
    user = db.query(User).filter(User.email == creds.email.lower().strip()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended."
        )

    log_audit_event(
        db, user.id, "LOGIN", "User", str(user.id),
        details="User authenticated successfully",
        ip_address=client_ip
    )

    access_token = create_access_token(subject=str(user.id))
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
