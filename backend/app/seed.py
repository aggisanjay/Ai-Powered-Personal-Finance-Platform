import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from datetime import date, timedelta
from decimal import Decimal
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models import (
    User, FinancialAccount, Category, Transaction,
    CategorizationRule, Budget, Receipt
)
from backend.app.core.security import hash_password
from backend.app.services.auth_service import DEFAULT_CATEGORIES, DEFAULT_RULES
from backend.app.analytics.calculator import detect_recurring_expenses, detect_duplicate_candidates

def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    demo_email = "demo@finance.ai"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        print("Creating demo user...")
        user = User(
            email=demo_email,
            password_hash=hash_password("DemoPassword123!"),
            full_name="Alex Morgan",
            currency_code="USD",
            status="active"
        )
        db.add(user)
        db.flush()
    else:
        print("Demo user 'demo@finance.ai' found. Verifying accounts, categories, and transactions...")

    # Ensure accounts exist
    checking = db.query(FinancialAccount).filter(
        FinancialAccount.user_id == user.id,
        FinancialAccount.account_type == "checking"
    ).first()
    if not checking:
        checking = FinancialAccount(
            user_id=user.id,
            name="Chase Total Checking",
            institution="Chase",
            account_type="checking",
            default_currency="USD",
            balance=Decimal("4250.80")
        )
        db.add(checking)

    credit_card = db.query(FinancialAccount).filter(
        FinancialAccount.user_id == user.id,
        FinancialAccount.account_type == "credit"
    ).first()
    if not credit_card:
        credit_card = FinancialAccount(
            user_id=user.id,
            name="Sapphire Reserve Credit",
            institution="Chase",
            account_type="credit",
            default_currency="USD",
            balance=Decimal("-1230.45")
        )
        db.add(credit_card)

    savings = db.query(FinancialAccount).filter(
        FinancialAccount.user_id == user.id,
        FinancialAccount.account_type == "savings"
    ).first()
    if not savings:
        savings = FinancialAccount(
            user_id=user.id,
            name="High-Yield Savings",
            institution="Marcus by Goldman Sachs",
            account_type="savings",
            default_currency="USD",
            balance=Decimal("15800.00")
        )
        db.add(savings)

    db.flush()

    # Ensure categories exist
    cat_map = {}
    existing_cats = db.query(Category).filter(
        (Category.user_id == user.id) | (Category.user_id == None)
    ).all()
    for ec in existing_cats:
        cat_map[ec.name] = ec.id

    for c in DEFAULT_CATEGORIES:
        if c["name"] not in cat_map:
            category = Category(
                user_id=user.id,
                name=c["name"],
                color=c["color"],
                icon=c["icon"],
                is_income=c["is_income"]
            )
            db.add(category)
            db.flush()
            cat_map[c["name"]] = category.id

    # Ensure rules exist
    for r in DEFAULT_RULES:
        if r["category"] in cat_map:
            existing_rule = db.query(CategorizationRule).filter(
                CategorizationRule.user_id == user.id,
                CategorizationRule.name == r["name"]
            ).first()
            if not existing_rule:
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

    # Ensure budgets exist for October and September
    budget_targets = [
        ("Housing & Rent", Decimal("2200.00")),
        ("Groceries", Decimal("550.00")),
        ("Dining & Cafes", Decimal("350.00")),
        ("Transport & Fuel", Decimal("200.00")),
        ("Utilities & Bills", Decimal("300.00")),
        ("Subscriptions", Decimal("100.00")),
        ("Shopping", Decimal("400.00")),
    ]
    for cat_name, b_amt in budget_targets:
        c_id = cat_map.get(cat_name)
        if c_id:
            for month in ["2026-10", "2026-09"]:
                b_exist = db.query(Budget).filter(
                    Budget.user_id == user.id,
                    Budget.category_id == c_id,
                    Budget.period_month == month
                ).first()
                if not b_exist:
                    db.add(Budget(
                        user_id=user.id,
                        category_id=c_id,
                        period_month=month,
                        amount=b_amt
                    ))

    # Fix any internal transfers incorrectly categorized under Salary & Income
    salary_cat_id = cat_map.get("Salary & Income")
    inv_cat_id = cat_map.get("Investments")
    if salary_cat_id:
        misclassified_txs = db.query(Transaction).filter(
            Transaction.user_id == user.id,
            Transaction.category_id == salary_cat_id,
            Transaction.amount < 0
        ).all()
        for mtx in misclassified_txs:
            mtx.category_id = inv_cat_id

    # Check if transactions exist
    tx_count = db.query(Transaction).filter(Transaction.user_id == user.id).count()

    if tx_count < 25:
        print("Seeding multi-month transactions, recurring cycles, and duplicate candidates...")
        transactions_data = [
            # October Payroll & Income
            (date(2026, 10, 1), "Direct Deposit - TechCorp Payroll", "TechCorp", Decimal("5200.00"), "Salary & Income", checking.id),
            (date(2026, 10, 15), "Consulting Project Payout", "Acme Labs", Decimal("1400.00"), "Investments", checking.id),

            # October Housing & Rent
            (date(2026, 10, 1), "Monthly Apartment Rent Payment", "Avalon Bay Communities", Decimal("-2100.00"), "Housing & Rent", checking.id),

            # October Groceries
            (date(2026, 10, 3), "Trader Joe's #142", "Trader Joe's", Decimal("-115.40"), "Groceries", credit_card.id),
            (date(2026, 10, 10), "Whole Foods Market", "Whole Foods", Decimal("-158.20"), "Groceries", credit_card.id),
            (date(2026, 10, 17), "Safeway Groceries #882", "Safeway", Decimal("-146.90"), "Groceries", checking.id),

            # October Dining & Cafes
            (date(2026, 10, 2), "Blue Bottle Coffee", "Blue Bottle", Decimal("-7.50"), "Dining & Cafes", credit_card.id),
            (date(2026, 10, 6), "Chipotle Mexican Grill", "Chipotle", Decimal("-18.45"), "Dining & Cafes", credit_card.id),
            (date(2026, 10, 14), "Tartine Bakery & Cafe", "Tartine", Decimal("-28.00"), "Dining & Cafes", credit_card.id),
            (date(2026, 10, 21), "Downtown Japanese Bistro", "Bistro Tokyo", Decimal("-92.00"), "Dining & Cafes", credit_card.id),

            # October Transport & Fuel
            (date(2026, 10, 5), "Chevron Station #901", "Chevron", Decimal("-48.50"), "Transport & Fuel", credit_card.id),
            (date(2026, 10, 18), "Shell Oil #332", "Shell", Decimal("-54.00"), "Transport & Fuel", credit_card.id),

            # October Subscriptions (Recurring)
            (date(2026, 10, 5), "Netflix Premium Subscription", "Netflix", Decimal("-22.99"), "Subscriptions", credit_card.id),
            (date(2026, 10, 12), "Spotify Family Plan", "Spotify", Decimal("-16.99"), "Subscriptions", credit_card.id),
            (date(2026, 10, 14), "GitHub Pro & Copilot", "GitHub", Decimal("-14.00"), "Subscriptions", credit_card.id),

            # October Utilities & Bills
            (date(2026, 10, 8), "Pacific Gas & Electric Bill", "PG&E", Decimal("-138.50"), "Utilities & Bills", checking.id),
            (date(2026, 10, 11), "Comcast Xfinity Internet", "Comcast", Decimal("-85.00"), "Utilities & Bills", checking.id),

            # October Duplicate charge candidates (Amazon double charge on same day)
            (date(2026, 10, 19), "Amazon.com*Order 99182", "Amazon", Decimal("-49.99"), "Shopping", credit_card.id),
            (date(2026, 10, 19), "Amazon.com*Order 99182", "Amazon", Decimal("-49.99"), "Shopping", credit_card.id),

            # September Payroll & Income
            (date(2026, 9, 1), "Direct Deposit - TechCorp Payroll", "TechCorp", Decimal("4500.00"), "Salary & Income", checking.id),
            (date(2026, 9, 15), "Consulting Project Payout", "Acme Labs", Decimal("1250.00"), "Investments", checking.id),

            # September Housing & Rent (Recurring)
            (date(2026, 9, 1), "Monthly Apartment Rent Payment", "Avalon Bay Communities", Decimal("-2100.00"), "Housing & Rent", checking.id),

            # September Groceries
            (date(2026, 9, 5), "Trader Joe's #142", "Trader Joe's", Decimal("-102.50"), "Groceries", credit_card.id),
            (date(2026, 9, 14), "Whole Foods Market", "Whole Foods", Decimal("-145.20"), "Groceries", credit_card.id),
            (date(2026, 9, 22), "Kroger Supermarket", "Kroger", Decimal("-180.00"), "Groceries", checking.id),

            # September Dining & Cafes
            (date(2026, 9, 4), "Starbucks Coffee #189", "Starbucks", Decimal("-6.95"), "Dining & Cafes", credit_card.id),
            (date(2026, 9, 12), "Local Bistro Dinner", "Local Bistro", Decimal("-88.50"), "Dining & Cafes", credit_card.id),

            # September Transport
            (date(2026, 9, 8), "Chevron Station #901", "Chevron", Decimal("-52.10"), "Transport & Fuel", credit_card.id),

            # September Subscriptions (Recurring ~30 days with October counterparts)
            (date(2026, 9, 5), "Netflix Premium Subscription", "Netflix", Decimal("-22.99"), "Subscriptions", credit_card.id),
            (date(2026, 9, 12), "Spotify Family Plan", "Spotify", Decimal("-16.99"), "Subscriptions", credit_card.id),
            (date(2026, 9, 14), "GitHub Pro & Copilot", "GitHub", Decimal("-14.00"), "Subscriptions", credit_card.id),

            # September Utilities (Recurring)
            (date(2026, 9, 8), "Pacific Gas & Electric Bill", "PG&E", Decimal("-142.30"), "Utilities & Bills", checking.id),
            (date(2026, 9, 11), "Comcast Xfinity Internet", "Comcast", Decimal("-85.00"), "Utilities & Bills", checking.id),

            # September Large Expense in Shopping (triggers Largest Expense Decrease in October!)
            (date(2026, 9, 16), "IKEA Furniture & Home Decor", "IKEA", Decimal("-1850.00"), "Shopping", credit_card.id),
            (date(2026, 9, 20), "Best Buy Electronics Upgrade", "Best Buy", Decimal("-650.00"), "Shopping", credit_card.id),
        ]

        for d, desc, merch, amt, cat_name, acc_id in transactions_data:
            tx = Transaction(
                user_id=user.id,
                account_id=acc_id,
                category_id=cat_map.get(cat_name),
                transaction_date=d,
                description=desc,
                merchant=merch,
                amount=amt,
                currency="USD",
                transaction_type="income" if amt > 0 else "expense",
                categorization_method="rule" if cat_name else "unassigned",
                categorization_confidence=Decimal("1.0000"),
                review_status="confirmed"
            )
            db.add(tx)

        db.flush()

    db.commit()

    # Run analytical detection so recurring and duplicate candidate tables are actively populated
    print("Running recurring expense detector...")
    recs = detect_recurring_expenses(db, user.id)
    print(f"Detected {len(recs)} recurring subscriptions.")

    print("Running duplicate charge auditor...")
    dups = detect_duplicate_candidates(db, user.id)
    print(f"Auditor flagged {len(dups)} duplicate candidate(s).")

    db.close()
    print("Seed complete: Demo accounts, multi-month transactions, recurring subscriptions, and duplicate audit records ready.")

if __name__ == "__main__":
    seed_demo_data()
