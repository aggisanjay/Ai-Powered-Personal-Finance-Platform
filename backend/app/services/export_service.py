import csv
import io
from typing import List
from sqlalchemy.orm import Session
from backend.app.models import Transaction, User

def sanitize_csv_cell(value: any) -> str:
    """Defends against formula injection in Excel / Google Sheets."""
    if value is None:
        return ""
    val_str = str(value)
    # Check if cell begins with dangerous trigger characters
    if val_str and val_str[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{val_str}"
    return val_str

def export_transactions_csv(db: Session, user_id: int) -> str:
    """Generates a secure, injection-safe CSV of all user transactions."""
    txs = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.transaction_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID", "Date", "Description", "Merchant", "Amount",
        "Currency", "Category", "Account", "Review Status", "Categorization Method"
    ])

    for t in txs:
        cat_name = t.category.name if t.category else "Unassigned"
        acc_name = t.account.name if t.account else "Default"
        writer.writerow([
            sanitize_csv_cell(t.id),
            sanitize_csv_cell(t.transaction_date.isoformat()),
            sanitize_csv_cell(t.description),
            sanitize_csv_cell(t.merchant or ""),
            sanitize_csv_cell(f"{t.amount:.2f}"),
            sanitize_csv_cell(t.currency),
            sanitize_csv_cell(cat_name),
            sanitize_csv_cell(acc_name),
            sanitize_csv_cell(t.review_status),
            sanitize_csv_cell(t.categorization_method),
        ])

    return output.getvalue()
