import re
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models import Transaction, Category, Budget
from backend.app.schemas import AssistantQueryResponse, SupportingTransaction
from backend.app.analytics.calculator import (
    calculate_monthly_summary, calculate_category_trends, calculate_budget_comparisons,
    get_month_date_range, get_previous_month_str, quantize_money
)
from backend.app.ai.llm_client import generate_ai_explanation

def query_grounded_assistant(
    db: Session,
    user_id: int,
    question: str,
    explicit_period: Optional[str] = None
) -> AssistantQueryResponse:
    """
    Answers natural language questions about the user's financial records.
    All underlying metrics are computed deterministically.
    Synthesizes the explanation via cloud AI (Gemini) with full telemetry
    (latency_ms, prompt_tokens, completion_tokens, total_tokens, cost_usd, model_source).
    Returns supporting transactions with specific IDs.
    """
    q_lower = question.lower()
    today = date.today()
    current_month_str = explicit_period or f"{today.year}-{today.month:02d}"

    # Determine intent & timeframe
    is_last_month = "last month" in q_lower or "previous month" in q_lower
    target_month = get_previous_month_str(current_month_str) if is_last_month else current_month_str

    start_date, end_date = get_month_date_range(target_month)

    # 1. Intent: Recurring / Subscriptions
    if any(k in q_lower for k in ["recurring", "subscription", "repeat", "netflix", "spotify"]):
        txs = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.amount < 0
        ).order_by(Transaction.transaction_date.desc()).all()

        # Find recurring merchants
        merchant_counts: Dict[str, List[Transaction]] = {}
        for t in txs:
            m = t.merchant or t.description
            if m:
                merchant_counts.setdefault(m.strip(), []).append(t)

        recurring = {m: lst for m, lst in merchant_counts.items() if len(lst) >= 2}
        total_sub_spend = sum(abs(t.amount) for lst in recurring.values() for t in lst)

        supporting = []
        for lst in list(recurring.values())[:5]:
            for t in lst[:2]:
                supporting.append(SupportingTransaction(
                    id=t.id,
                    transaction_date=t.transaction_date,
                    merchant=t.merchant,
                    description=t.description,
                    amount=quantize_money(abs(t.amount)),
                    category_name=t.category.name if t.category else "Subscriptions"
                ))

        merchant_names = ", ".join(list(recurring.keys())[:5]) or "None detected yet"
        baseline_explanation = (
            f"Found {len(recurring)} recurring merchant(s) ({merchant_names}) "
            f"with multiple repeating charges totaling ${quantize_money(total_sub_spend):,}. "
            f"Review the supporting transactions below for detailed intervals."
        )

        computed_facts = {
            "recurring_merchants_count": len(recurring),
            "recurring_merchants": merchant_names,
            "total_spent": float(total_sub_spend)
        }

        ai_text, lat_ms, p_tok, c_tok, tot_tok, cost, source = generate_ai_explanation(
            question=question,
            computed_facts=computed_facts,
            fallback_explanation=baseline_explanation
        )

        return AssistantQueryResponse(
            question=question,
            computed_facts=computed_facts,
            explanation=ai_text,
            supporting_transactions=supporting,
            date_range_applied=f"All history up to {end_date.strftime('%b %d, %Y')}",
            confidence_note="Computed from exact repeating merchant transaction history.",
            latency_ms=lat_ms,
            prompt_tokens=p_tok,
            completion_tokens=c_tok,
            total_tokens=tot_tok,
            cost_usd=cost,
            model_source=source
        )

    # 2. Intent: Budget performance
    if any(k in q_lower for k in ["budget", "allowance", "over budget", "remaining"]):
        budget_resp = calculate_budget_comparisons(db, user_id, target_month)
        over_items = [i for i in budget_resp.items if i.is_over_budget]

        over_summary = ""
        if over_items:
            over_names = ", ".join([f"{o.category_name} (over by ${o.actual_spent - o.budgeted_amount:,.2f})" for o in over_items])
            over_summary = f" Warning: You are over budget in {over_names}."
        else:
            over_summary = " All tracked categories are currently within budget limits."

        baseline_explanation = (
            f"In {target_month}, your total budgeted amount was ${budget_resp.total_budgeted:,.2f} "
            f"against actual spending of ${budget_resp.total_actual:,.2f} "
            f"({budget_resp.overall_utilization_percentage:.1f}% utilization).{over_summary}"
        )

        top_txs = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
            Transaction.amount < 0
        ).order_by(Transaction.amount.asc()).limit(5).all()

        supporting = [
            SupportingTransaction(
                id=t.id,
                transaction_date=t.transaction_date,
                merchant=t.merchant,
                description=t.description,
                amount=quantize_money(abs(t.amount)),
                category_name=t.category.name if t.category else "Uncategorized"
            ) for t in top_txs
        ]

        computed_facts = {
            "total_budgeted": float(budget_resp.total_budgeted),
            "total_actual": float(budget_resp.total_actual),
            "utilization_pct": float(budget_resp.overall_utilization_percentage),
            "over_budget_categories_count": len(over_items)
        }

        ai_text, lat_ms, p_tok, c_tok, tot_tok, cost, source = generate_ai_explanation(
            question=question,
            computed_facts=computed_facts,
            fallback_explanation=baseline_explanation
        )

        return AssistantQueryResponse(
            question=question,
            computed_facts=computed_facts,
            explanation=ai_text,
            supporting_transactions=supporting,
            date_range_applied=f"{start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}",
            confidence_note="Calculated from real-time database budget entries and verified transactions.",
            latency_ms=lat_ms,
            prompt_tokens=p_tok,
            completion_tokens=c_tok,
            total_tokens=tot_tok,
            cost_usd=cost,
            model_source=source
        )

    # 3. Intent: Specific category spending (e.g. Groceries, Transport, Dining)
    categories = db.query(Category).all()
    matched_cat = None
    for c in categories:
        if c.name.lower() in q_lower or (c.name.lower().split()[0] in q_lower and len(c.name.split()[0]) > 3):
            matched_cat = c
            break

    if matched_cat:
        cat_txs = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == matched_cat.id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
            Transaction.amount < 0
        ).order_by(Transaction.transaction_date.desc()).all()

        total_cat_spent = sum((abs(Decimal(str(t.amount))) for t in cat_txs), Decimal("0.00"))
        prev_month = get_previous_month_str(target_month)
        p_start, p_end = get_month_date_range(prev_month)
        prev_cat_txs = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == matched_cat.id,
            Transaction.transaction_date >= p_start,
            Transaction.transaction_date <= p_end,
            Transaction.amount < 0
        ).all()
        prev_cat_spent = sum((abs(Decimal(str(t.amount))) for t in prev_cat_txs), Decimal("0.00"))

        mom_diff = total_cat_spent - prev_cat_spent
        direction = "an increase" if mom_diff >= 0 else "a decrease"

        baseline_explanation = (
            f"You spent ${quantize_money(total_cat_spent):,.2f} on {matched_cat.name} in {target_month} across {len(cat_txs)} transaction(s). "
            f"Compared to {prev_month} (${quantize_money(prev_cat_spent):,.2f}), this represents {direction} of ${abs(quantize_money(mom_diff)):,.2f}."
        )

        supporting = [
            SupportingTransaction(
                id=t.id,
                transaction_date=t.transaction_date,
                merchant=t.merchant,
                description=t.description,
                amount=quantize_money(abs(t.amount)),
                category_name=matched_cat.name
            ) for t in cat_txs[:8]
        ]

        computed_facts = {
            "category": matched_cat.name,
            "current_spent": float(total_cat_spent),
            "previous_spent": float(prev_cat_spent),
            "difference": float(mom_diff),
            "transaction_count": len(cat_txs)
        }

        ai_text, lat_ms, p_tok, c_tok, tot_tok, cost, source = generate_ai_explanation(
            question=question,
            computed_facts=computed_facts,
            fallback_explanation=baseline_explanation
        )

        return AssistantQueryResponse(
            question=question,
            computed_facts=computed_facts,
            explanation=ai_text,
            supporting_transactions=supporting,
            date_range_applied=f"{start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}",
            confidence_note=f"Exact sum of {len(cat_txs)} transactions classified under {matched_cat.name}.",
            latency_ms=lat_ms,
            prompt_tokens=p_tok,
            completion_tokens=c_tok,
            total_tokens=tot_tok,
            cost_usd=cost,
            model_source=source
        )

    # 4. Default / Overall Monthly Summary or Largest Expenses
    summary = calculate_monthly_summary(db, user_id, target_month)
    top_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.amount < 0
    ).order_by(Transaction.amount.asc()).limit(5).all()

    baseline_explanation = (
        f"For {target_month}, your total income was ${summary.total_income:,.2f} and total expenses were ${summary.total_expenses:,.2f}, "
        f"yielding a net cash flow of ${summary.net_cash_flow:,.2f} (savings rate of {summary.savings_rate:.1f}%). "
        f"You logged {summary.transaction_count} transaction(s)."
    )

    supporting = [
        SupportingTransaction(
            id=t.id,
            transaction_date=t.transaction_date,
            merchant=t.merchant,
            description=t.description,
            amount=quantize_money(abs(t.amount)),
            category_name=t.category.name if t.category else "Uncategorized"
        ) for t in top_txs
    ]

    computed_facts = {
        "total_income": float(summary.total_income),
        "total_expenses": float(summary.total_expenses),
        "net_cash_flow": float(summary.net_cash_flow),
        "savings_rate_pct": float(summary.savings_rate),
        "transaction_count": summary.transaction_count
    }

    ai_text, lat_ms, p_tok, c_tok, tot_tok, cost, source = generate_ai_explanation(
        question=question,
        computed_facts=computed_facts,
        fallback_explanation=baseline_explanation
    )

    return AssistantQueryResponse(
        question=question,
        computed_facts=computed_facts,
        explanation=ai_text,
        supporting_transactions=supporting,
        date_range_applied=f"{start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}",
        confidence_note="Fully verified deterministic calculation from stored financial records.",
        latency_ms=lat_ms,
        prompt_tokens=p_tok,
        completion_tokens=c_tok,
        total_tokens=tot_tok,
        cost_usd=cost,
        model_source=source
    )
