import csv
import io
import os
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, FinancialAccount, ImportBatch, Transaction
from backend.app.schemas import (
    CSVPreviewResponse, ColumnMapping, ImportBatchResponse
)
from backend.app.ingestion.csv_parser import (
    preview_csv_content, parse_flexible_date, parse_flexible_amount
)
from backend.app.services.rules_engine import apply_categorization_rules
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/imports", tags=["Imports"])

# In-memory storage for preview session files (keyed by user_id + filename)
_FILE_CACHE = {}

@router.post("/preview", response_model=CSVPreviewResponse)
async def preview_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    try:
        preview = preview_csv_content(content, file.filename)
        # Cache content temporarily for the confirmation step
        cache_key = f"{current_user.id}:{file.filename}"
        _FILE_CACHE[cache_key] = content
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

@router.post("/confirm", response_model=ImportBatchResponse)
def confirm_import(
    account_id: int = Form(...),
    filename: str = Form(...),
    date_col: str = Form(...),
    description_col: str = Form(...),
    amount_col: str = Form(None),
    debit_col: str = Form(None),
    credit_col: str = Form(None),
    merchant_col: str = Form(None),
    currency_col: str = Form(None),
    date_format: str = Form(None),
    apply_rules: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(FinancialAccount).filter(
        FinancialAccount.id == account_id,
        FinancialAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    cache_key = f"{current_user.id}:{filename}"
    content = _FILE_CACHE.get(cache_key)
    if not content:
        raise HTTPException(status_code=400, detail="Import session expired. Please upload the file again.")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    batch = ImportBatch(
        user_id=current_user.id,
        filename=filename,
        total_rows=len(rows),
        imported_rows=0,
        skipped_rows=0,
        status="pending"
    )
    db.add(batch)
    db.flush()

    imported_count = 0
    skipped_count = 0
    total_balance_change = Decimal("0.00")

    for row in rows:
        raw_date = row.get(date_col, "")
        raw_desc = row.get(description_col, "")
        raw_amount = row.get(amount_col, "") if amount_col else None
        raw_debit = row.get(debit_col, "") if debit_col else None
        raw_credit = row.get(credit_col, "") if credit_col else None
        raw_merchant = row.get(merchant_col, "") if merchant_col else None
        raw_currency = row.get(currency_col, "") if currency_col else account.default_currency

        parsed_d = parse_flexible_date(raw_date, date_format)
        parsed_a = parse_flexible_amount(raw_amount, raw_debit, raw_credit)

        if not parsed_d or parsed_a is None or not raw_desc or not raw_desc.strip():
            skipped_count += 1
            continue

        category_id = None
        cat_method = "unassigned"
        confidence = None

        if apply_rules:
            matched_cat = apply_categorization_rules(db, current_user.id, raw_desc, raw_merchant)
            if matched_cat:
                category_id = matched_cat
                cat_method = "rule"
                confidence = Decimal("1.0000")

        tx = Transaction(
            user_id=current_user.id,
            account_id=account.id,
            category_id=category_id,
            import_batch_id=batch.id,
            transaction_date=parsed_d,
            description=raw_desc.strip()[:500],
            merchant=raw_merchant.strip()[:255] if raw_merchant else None,
            amount=parsed_a,
            currency=raw_currency.strip()[:3] if raw_currency else "USD",
            transaction_type="income" if parsed_a > 0 else "expense",
            categorization_method=cat_method,
            categorization_confidence=confidence,
            review_status="confirmed"
        )
        db.add(tx)
        total_balance_change += parsed_a
        imported_count += 1

    account.balance += total_balance_change
    batch.imported_rows = imported_count
    batch.skipped_rows = skipped_count
    batch.status = "success" if imported_count > 0 else "failed"

    db.commit()
    db.refresh(batch)

    log_audit_event(
        db, current_user.id, "IMPORT_CSV", "ImportBatch", str(batch.id),
        details=f"Imported {imported_count} rows from {filename} ({skipped_count} skipped)"
    )

    # Clean up file cache
    _FILE_CACHE.pop(cache_key, None)

    return batch

@router.get("/batches", response_model=List[ImportBatchResponse])
def list_import_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ImportBatch).filter(
        ImportBatch.user_id == current_user.id
    ).order_by(ImportBatch.created_at.desc()).all()
