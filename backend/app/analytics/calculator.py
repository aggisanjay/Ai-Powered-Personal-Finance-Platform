from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from backend.app.models import Transaction, Category, Budget, FinancialAccount, RecurringExpense, DuplicateCandidate
from backend.app.schemas import (
    MonthlySummaryResponse, CategoryTrendsResponse, CategorySpendingItem,
    BudgetComparisonResponse, BudgetComparisonItem
)

def quantize_money(amount: Any) -> Decimal:
    if amount is None:
        return Decimal("0.00")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def get_month_date_range(year_month: str) -> Tuple[date, date]:
    """Given YYYY-MM, returns (start_date, end_date) inclusive."""
    year, month = map(int, year_month.split("-"))
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    return start_date, end_date

def get_previous_month_str(year_month: str) -> str:
    year, month = map(int, year_month.split("-"))
    if month == 1:
        return f"{year - 1}-12"
    else:
        return f"{year}-{month - 1:02d}"

def calculate_monthly_summary(
    db: Session,
    user_id: int,
    period_month: str,
    account_id: Optional[int] = None
) -> MonthlySummaryResponse:
    start_date, end_date = get_month_date_range(period_month)

    # Base query for current month
    query = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.review_status != "rejected"
    )
    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    transactions = query.all()

    total_income = Decimal("0.00")
    total_expenses = Decimal("0.00")

    for t in transactions:
        amt = Decimal(str(t.amount))
        if amt > 0:
            total_income += amt
        else:
            total_expenses += abs(amt)

    net_cash_flow = total_income - total_expenses
    savings_rate = Decimal("0.00")
    if total_income > 0:
        savings_rate = ((net_cash_flow / total_income) * Decimal("100.00")).quantize(Decimal("0.01"))

    # Previous period comparison
    prev_month = get_previous_month_str(period_month)
    prev_start, prev_end = get_month_date_range(prev_month)
    prev_query = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= prev_start,
        Transaction.transaction_date <= prev_end,
        Transaction.review_status != "rejected"
    )
    if account_id:
        prev_query = prev_query.filter(Transaction.account_id == account_id)
    prev_txs = prev_query.all()

    prev_income = Decimal("0.00")
    prev_expenses = Decimal("0.00")
    for pt in prev_txs:
        p_amt = Decimal(str(pt.amount))
        if p_amt > 0:
            prev_income += p_amt
        else:
            prev_expenses += abs(p_amt)

    mom_change_amount = total_expenses - prev_expenses
    mom_change_percent = None
    if prev_expenses > 0:
        mom_change_percent = ((mom_change_amount / prev_expenses) * Decimal("100.00")).quantize(Decimal("0.01"))

    return MonthlySummaryResponse(
        period_month=period_month,
        total_income=quantize_money(total_income),
        total_expenses=quantize_money(total_expenses),
        net_cash_flow=quantize_money(net_cash_flow),
        savings_rate=savings_rate,
        transaction_count=len(transactions),
        previous_period_month=prev_month,
        previous_income=quantize_money(prev_income),
        previous_expenses=quantize_money(prev_expenses),
        mom_expense_change_amount=quantize_money(mom_change_amount),
        mom_expense_change_percent=mom_change_percent
    )

def calculate_category_trends(
    db: Session,
    user_id: int,
    period_month: str
) -> CategoryTrendsResponse:
    start_date, end_date = get_month_date_range(period_month)
    prev_month = get_previous_month_str(period_month)
    prev_start, prev_end = get_month_date_range(prev_month)

    # Current month expenses
    curr_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.amount < 0,
        Transaction.review_status != "rejected"
    ).all()

    # Previous month expenses
    prev_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= prev_start,
        Transaction.transaction_date <= prev_end,
        Transaction.amount < 0,
        Transaction.review_status != "rejected"
    ).all()

    # Categories lookup
    categories = db.query(Category).filter(
        or_(Category.user_id == user_id, Category.user_id == None)
    ).all()
    cat_lookup = {c.id: c for c in categories}

    curr_totals: Dict[Optional[int], Decimal] = {}
    curr_counts: Dict[Optional[int], int] = {}
    total_spent = Decimal("0.00")

    for t in curr_txs:
        cat = cat_lookup.get(t.category_id)
        if cat and cat.is_income:
            continue  # Exclude income categories from expense trends
        amt = abs(Decimal(str(t.amount)))
        curr_totals[t.category_id] = curr_totals.get(t.category_id, Decimal("0.00")) + amt
        curr_counts[t.category_id] = curr_counts.get(t.category_id, 0) + 1
        total_spent += amt

    prev_totals: Dict[Optional[int], Decimal] = {}
    for pt in prev_txs:
        pcat = cat_lookup.get(pt.category_id)
        if pcat and pcat.is_income:
            continue  # Exclude income categories from prior month expense trends
        amt = abs(Decimal(str(pt.amount)))
        prev_totals[pt.category_id] = prev_totals.get(pt.category_id, Decimal("0.00")) + amt

    items: List[CategorySpendingItem] = []
    for cat_id, amt in curr_totals.items():
        cat = cat_lookup.get(cat_id)
        name = cat.name if cat else "Uncategorized"
        color = cat.color if cat else "#9CA3AF"
        icon = cat.icon if cat else "HelpCircle"

        pct = Decimal("0.00")
        if total_spent > 0:
            pct = ((amt / total_spent) * Decimal("100.00")).quantize(Decimal("0.01"))

        prev_amt = prev_totals.get(cat_id, Decimal("0.00"))
        change_amt = amt - prev_amt
        change_pct = None
        if prev_amt > 0:
            change_pct = ((change_amt / prev_amt) * Decimal("100.00")).quantize(Decimal("0.01"))

        items.append(CategorySpendingItem(
            category_id=cat_id or 0,
            category_name=name,
            category_color=color,
            category_icon=icon,
            amount=quantize_money(amt),
            percentage=pct,
            transaction_count=curr_counts.get(cat_id, 0),
            previous_amount=quantize_money(prev_amt),
            mom_change_amount=quantize_money(change_amt),
            mom_change_percent=change_pct
        ))

    items.sort(key=lambda x: x.amount, reverse=True)

    largest_inc = None
    largest_dec = None
    if items:
        inc_candidates = [i for i in items if i.mom_change_amount is not None and i.mom_change_amount > 0]
        if inc_candidates:
            largest_inc = max(inc_candidates, key=lambda x: x.mom_change_amount)

        dec_candidates = [i for i in items if i.mom_change_amount is not None and i.mom_change_amount < 0]
        if dec_candidates:
            largest_dec = min(dec_candidates, key=lambda x: x.mom_change_amount)

    return CategoryTrendsResponse(
        period_month=period_month,
        categories=items,
        largest_increase=largest_inc,
        largest_decrease=largest_dec
    )

def calculate_budget_comparisons(
    db: Session,
    user_id: int,
    period_month: str
) -> BudgetComparisonResponse:
    start_date, end_date = get_month_date_range(period_month)

    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.period_month == period_month
    ).all()

    # Sum spending per category in period
    spending_query = db.query(
        Transaction.category_id,
        func.sum(func.abs(Transaction.amount)).label("total_spent")
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.amount < 0,
        Transaction.review_status != "rejected"
    ).group_by(Transaction.category_id).all()

    spending_map = {cat_id: Decimal(str(tot or 0)) for cat_id, tot in spending_query}

    categories = {c.id: c for c in db.query(Category).all()}

    items: List[BudgetComparisonItem] = []
    total_budgeted = Decimal("0.00")
    total_actual = Decimal("0.00")

    for b in budgets:
        cat = categories.get(b.category_id)
        cat_name = cat.name if cat else "Unknown"
        cat_color = cat.color if cat else "#6B7280"
        cat_icon = cat.icon if cat else "Tag"

        budget_amt = Decimal(str(b.amount))
        actual = spending_map.get(b.category_id, Decimal("0.00"))
        remaining = budget_amt - actual

        util_pct = Decimal("0.00")
        if budget_amt > 0:
            util_pct = ((actual / budget_amt) * Decimal("100.00")).quantize(Decimal("0.01"))

        is_over = actual > budget_amt

        total_budgeted += budget_amt
        total_actual += actual

        items.append(BudgetComparisonItem(
            budget_id=b.id,
            category_id=b.category_id,
            category_name=cat_name,
            category_color=cat_color,
            category_icon=cat_icon,
            budgeted_amount=quantize_money(budget_amt),
            actual_spent=quantize_money(actual),
            remaining_amount=quantize_money(remaining),
            utilization_percentage=util_pct,
            is_over_budget=is_over
        ))

    overall_util = Decimal("0.00")
    if total_budgeted > 0:
        overall_util = ((total_actual / total_budgeted) * Decimal("100.00")).quantize(Decimal("0.01"))

    return BudgetComparisonResponse(
        period_month=period_month,
        total_budgeted=quantize_money(total_budgeted),
        total_actual=quantize_money(total_actual),
        overall_utilization_percentage=overall_util,
        items=items
    )

def detect_recurring_expenses(db: Session, user_id: int) -> List[RecurringExpense]:
    """
    Identifies repeated payments to the same merchant with identical/similar amounts
    spaced by approximately 7, 14, or 28-32 days, or obvious recurring subscription indicators.
    """
    # Fetch all expense transactions for user sorted by merchant, date
    txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.amount < 0,
        Transaction.review_status != "rejected"
    ).order_by(Transaction.merchant.asc(), Transaction.transaction_date.asc()).all()

    grouped: Dict[str, List[Transaction]] = {}
    for t in txs:
        merchant_key = (t.merchant or t.description or "").strip().lower()
        if len(merchant_key) < 3:
            continue
        grouped.setdefault(merchant_key, []).append(t)

    detected: List[RecurringExpense] = []

    # High-signal recurring indicators
    SUB_KEYWORDS = [
        "monthly", "subscription", "gym", "broadband", "netflix", "spotify",
        "github", "rent", "recharge", "cloud storage", "membership", "electricity bill",
        "water bill", "internet"
    ]

    for merchant_name, m_txs in grouped.items():
        is_sub_keyword = any(k in merchant_name for k in SUB_KEYWORDS)
        if len(m_txs) < 2 and not is_sub_keyword:
            continue

        intervals = []
        for i in range(1, len(m_txs)):
            delta_days = (m_txs[i].transaction_date - m_txs[i-1].transaction_date).days
            if delta_days > 0:
                intervals.append((delta_days, abs(Decimal(str(m_txs[i].amount)))))

        monthly_matches = [amt for d, amt in intervals if 25 <= d <= 35]
        weekly_matches = [amt for d, amt in intervals if 6 <= d <= 8]

        interval_days = 30
        cluster = monthly_matches
        if len(weekly_matches) > len(monthly_matches):
            interval_days = 7
            cluster = weekly_matches

        if len(cluster) >= 1 or len(m_txs) >= 2 or is_sub_keyword:
            avg_amount = sum([abs(Decimal(str(t.amount))) for t in m_txs]) / len(m_txs)
            last_date = max(t.transaction_date for t in m_txs)

            # Check if record already exists
            existing = db.query(RecurringExpense).filter(
                RecurringExpense.user_id == user_id,
                func.lower(RecurringExpense.merchant) == merchant_name
            ).first()

            confidence = Decimal("0.9500") if len(m_txs) >= 2 else Decimal("0.8500")

            if not existing:
                rec = RecurringExpense(
                    user_id=user_id,
                    merchant=m_txs[0].merchant or m_txs[0].description,
                    amount=quantize_money(avg_amount),
                    currency=m_txs[0].currency,
                    interval_days=interval_days,
                    last_payment_date=last_date,
                    occurrences_count=len(m_txs),
                    confidence=confidence,
                    status="active"
                )
                db.add(rec)
                detected.append(rec)
            else:
                existing.occurrences_count = max(existing.occurrences_count, len(m_txs))
                existing.last_payment_date = last_date
                existing.amount = quantize_money(avg_amount)

    db.commit()
    return db.query(RecurringExpense).filter(RecurringExpense.user_id == user_id).all()

def detect_duplicate_candidates(db: Session, user_id: int) -> List[DuplicateCandidate]:
    """
    Identifies potential duplicate charges: transactions with identical amounts
    occurring within 2 days of each other with identical or very similar merchant/description.
    """
    txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.review_status != "rejected"
    ).order_by(Transaction.transaction_date.asc()).all()

    existing_pairs = set(
        (dc.primary_transaction_id, dc.duplicate_transaction_id)
        for dc in db.query(DuplicateCandidate).filter(DuplicateCandidate.user_id == user_id).all()
    )

    new_candidates = []
    n = len(txs)
    for i in range(n):
        for j in range(i + 1, n):
            t1, t2 = txs[i], txs[j]
            day_diff = abs((t2.transaction_date - t1.transaction_date).days)
            if day_diff > 3:
                continue

            # Check amount match
            if t1.amount == t2.amount:
                d1 = (t1.description or "").lower()
                d2 = (t2.description or "").lower()
                m1 = (t1.merchant or "").lower()
                m2 = (t2.merchant or "").lower()

                # Similarity check
                match = (m1 and m1 == m2) or (d1 == d2) or (m1 and m1 in d2) or (m2 and m2 in d1)
                if match:
                    pair = (t1.id, t2.id)
                    if pair not in existing_pairs and (t2.id, t1.id) not in existing_pairs:
                        cand = DuplicateCandidate(
                            user_id=user_id,
                            primary_transaction_id=t1.id,
                            duplicate_transaction_id=t2.id,
                            similarity_score=Decimal("0.9500") if day_diff == 0 else Decimal("0.8500"),
                            reason=f"Identical amount ({t1.currency} {abs(t1.amount)}) within {day_diff} day(s)",
                            status="detected"
                        )
                        db.add(cand)
                        new_candidates.append(cand)
                        existing_pairs.add(pair)

    db.commit()
    return db.query(DuplicateCandidate).filter(DuplicateCandidate.user_id == user_id).all()
