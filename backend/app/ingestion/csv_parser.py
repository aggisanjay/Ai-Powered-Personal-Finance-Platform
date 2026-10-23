import csv
import io
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Any, Tuple, Optional
from dateutil import parser as date_parser
from backend.app.schemas import ColumnMapping, CSVPreviewResponse, CSVPreviewRow

COMMON_DATE_PATTERNS = [
    "%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
    "%m/%d/%Y", "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %I:%M %p", "%m/%d/%Y %I:%M:%S %p",
    "%d/%m/%Y", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %I:%M %p",
    "%Y/%m/%d", "%Y/%m/%d %H:%M:%S",
    "%d-%m-%Y", "%m-%d-%Y", "%d %b %Y", "%d %B %Y",
    "%b %d, %Y", "%B %d, %Y"
]

def parse_flexible_date(date_str: str, specific_format: Optional[str] = None) -> Optional[date]:
    if not date_str or not date_str.strip():
        return None
    cleaned = date_str.strip()

    # Reject typical identifier/ticket patterns (e.g. TKT-1001, INV-402, TX-99)
    if re.match(r"^[A-Za-z]{1,8}[-_]\d+$", cleaned, re.IGNORECASE):
        return None

    # Reject pure numbers or currency (e.g. 45.00, $120.50, 1000)
    cleaned_num = re.sub(r"[^\d.-]", "", cleaned)
    if cleaned_num and not any(c in cleaned for c in ["/", ":"]) and (cleaned_num.replace(".", "", 1).replace("-", "", 1).isdigit() and len(cleaned_num.split("-")[0]) <= 2):
        try:
            float(cleaned_num)
            return None
        except ValueError:
            pass

    if specific_format:
        try:
            return datetime.strptime(cleaned, specific_format).date()
        except Exception:
            pass

    for fmt in COMMON_DATE_PATTERNS:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except Exception:
            continue

    if any(delim in cleaned for delim in ["-", "/", " ", ".", ":"]):
        try:
            parsed = date_parser.parse(cleaned)
            if 1990 <= parsed.year <= 2100:
                return parsed.date()
        except Exception:
            return None

    return None

def parse_flexible_amount(
    amount_str: Optional[str] = None,
    debit_str: Optional[str] = None,
    credit_str: Optional[str] = None
) -> Optional[Decimal]:
    """
    Parses amount string safely into Decimal.
    Expenses are negative, Income is positive.
    """
    def clean_num(val: str) -> str:
        # Remove currency symbols, commas, quotes
        cleaned = re.sub(r"[^\d.-]", "", val)
        return cleaned

    # Check separate debit/credit columns
    if debit_str and debit_str.strip():
        try:
            val = Decimal(clean_num(debit_str))
            if val != 0:
                return -abs(val) # Debit is an expense (negative)
        except (InvalidOperation, ValueError):
            pass

    if credit_str and credit_str.strip():
        try:
            val = Decimal(clean_num(credit_str))
            if val != 0:
                return abs(val) # Credit is income (positive)
        except (InvalidOperation, ValueError):
            pass

    # Check unified amount column
    if amount_str and amount_str.strip():
        try:
            raw = amount_str.strip()
            # If wrapped in parentheses like (50.00), it's negative
            is_parenthesized = raw.startswith("(") and raw.endswith(")")
            val = Decimal(clean_num(raw))
            if is_parenthesized:
                return -abs(val)
            return val
        except (InvalidOperation, ValueError):
            return None

    return None

def auto_detect_columns(headers: List[str], sample_rows: Optional[List[Dict[str, str]]] = None) -> ColumnMapping:
    headers_lower = {h.lower().strip(): h for h in headers}

    # 1. External ID (by header name or ticket-like format)
    external_id_col = None
    id_candidates = [
        "id", "ticket_id", "ticket id", "ticket", "ticket no", "ticket_no", "ticket#",
        "tkt_id", "tkt", "tkt #", "transaction id", "trans id", "trans_id", "reference",
        "ref no", "ref", "tx_id", "tx id", "order id", "order_id", "issue", "record"
    ]
    for candidate in id_candidates:
        if candidate in headers_lower:
            external_id_col = headers_lower[candidate]
            break

    # If sample rows exist, detect ID column by ticket-like format (e.g. TKT-1001)
    if not external_id_col and sample_rows:
        for h in headers:
            vals = [r.get(h, "").strip() for r in sample_rows[:5] if r.get(h, "").strip()]
            if vals and any(re.match(r"^[A-Za-z]{1,8}[-_]\d+$", v) for v in vals):
                external_id_col = h
                break

    # 2. Date column detection (prioritize content scoring when sample rows available)
    date_col = ""
    if sample_rows:
        date_scores = {}
        for h in headers:
            if h == external_id_col:
                continue
            vals = [r.get(h, "").strip() for r in sample_rows[:10] if r.get(h, "").strip()]
            if vals:
                valid_count = sum(1 for v in vals if parse_flexible_date(v) is not None)
                date_scores[h] = valid_count / len(vals)
            else:
                date_scores[h] = 0.0

        candidates = [h for h, s in date_scores.items() if s >= 0.5]
        if candidates:
            date_col = max(
                candidates,
                key=lambda h: (date_scores[h], any(k in h.lower() for k in ["date", "time", "created", "timestamp"]))
            )

    if not date_col:
        date_candidates = [
            "date", "transaction date", "trans date", "posting date", "posted", "booking date",
            "created_at", "created at", "timestamp", "datetime", "date/time", "time", "created"
        ]
        for candidate in date_candidates:
            if candidate in headers_lower and headers_lower[candidate] != external_id_col:
                date_col = headers_lower[candidate]
                break
        if not date_col:
            for h in headers:
                if h != external_id_col and any(k in h.lower() for k in ["date", "time", "created", "timestamp"]):
                    date_col = h
                    break

    # 3. Description column
    desc_col = ""
    desc_candidates = [
        "description", "narrative", "details", "memo", "name", "transaction description",
        "subject", "summary", "notes", "title", "merchant", "item"
    ]
    for candidate in desc_candidates:
        if candidate in headers_lower and headers_lower[candidate] != date_col and headers_lower[candidate] != external_id_col:
            desc_col = headers_lower[candidate]
            break

    if not desc_col and sample_rows:
        for h in headers:
            if h in (date_col, external_id_col):
                continue
            vals = [r.get(h, "").strip() for r in sample_rows[:5] if r.get(h, "").strip()]
            if vals and any(len(v) >= 3 and not re.match(r"^[\d.,$-]+$", v) for v in vals):
                desc_col = h
                break

    if not desc_col:
        for h in headers:
            if h != date_col and h != external_id_col:
                if any(k in h.lower() for k in ["desc", "detail", "memo", "text", "subject", "summary"]):
                    desc_col = h
                    break

    # 4. Amount column
    amount_col = ""
    for candidate in ["amount", "transaction amount", "total", "net amount", "price", "cost", "value"]:
        if candidate in headers_lower and headers_lower[candidate] not in (date_col, external_id_col):
            amount_col = headers_lower[candidate]
            break

    debit_col = None
    for candidate in ["debit", "withdrawal", "outflow", "paid out"]:
        if candidate in headers_lower:
            debit_col = headers_lower[candidate]
            break

    credit_col = None
    for candidate in ["credit", "deposit", "inflow", "paid in"]:
        if candidate in headers_lower:
            credit_col = headers_lower[candidate]
            break

    if not amount_col and not debit_col and not credit_col and sample_rows:
        for h in headers:
            if h in (date_col, external_id_col, desc_col):
                continue
            vals = [r.get(h, "").strip() for r in sample_rows[:5] if r.get(h, "").strip()]
            if vals and all(re.match(r"^[-+]?\$?[\d,]+(\.\d+)?$", v) for v in vals):
                amount_col = h
                break

    merchant_col = None
    for candidate in ["merchant", "payee", "vendor"]:
        if candidate in headers_lower and headers_lower[candidate] not in (date_col, external_id_col):
            merchant_col = headers_lower[candidate]
            break

    currency_col = None
    for candidate in ["currency", "curr"]:
        if candidate in headers_lower:
            currency_col = headers_lower[candidate]
            break

    # Robust fallbacks
    available_non_id = [h for h in headers if h != external_id_col]
    if not date_col:
        date_col = available_non_id[0] if available_non_id else (headers[0] if headers else "")
    if not desc_col:
        remaining = [h for h in headers if h != date_col and h != external_id_col]
        desc_col = remaining[0] if remaining else (headers[1] if len(headers) > 1 else headers[0])

    return ColumnMapping(
        date_col=date_col,
        description_col=desc_col,
        amount_col=amount_col or (None if (debit_col or credit_col) else (headers[2] if len(headers) > 2 else None)),
        debit_col=debit_col,
        credit_col=credit_col,
        merchant_col=merchant_col,
        currency_col=currency_col,
        external_id_col=external_id_col
    )

def preview_csv_content(content_bytes: bytes, filename: str) -> CSVPreviewResponse:
    # Handle UTF-8 with BOM or latin-1 fallback
    try:
        text = content_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content_bytes.decode("latin-1")

    raw_reader = csv.DictReader(io.StringIO(text))
    if not raw_reader.fieldnames:
        raise ValueError("CSV file has no headers or is empty.")

    fieldnames = [f.strip() for f in raw_reader.fieldnames if f]
    all_rows = list(raw_reader)
    mapping = auto_detect_columns(fieldnames, sample_rows=all_rows[:10])

    sample_rows: List[CSVPreviewRow] = []
    valid_count = 0
    invalid_count = 0
    row_num = 1

    for row in all_rows:
        row_num += 1
        raw_date = row.get(mapping.date_col, "")
        raw_desc = row.get(mapping.description_col, "")
        raw_amount = row.get(mapping.amount_col, "") if mapping.amount_col else None
        raw_debit = row.get(mapping.debit_col, "") if mapping.debit_col else None
        raw_credit = row.get(mapping.credit_col, "") if mapping.credit_col else None
        raw_merchant = row.get(mapping.merchant_col, "") if mapping.merchant_col else None

        parsed_d = parse_flexible_date(raw_date, mapping.date_format)
        parsed_a = parse_flexible_amount(raw_amount, raw_debit, raw_credit)

        error_msg = None
        if not parsed_d:
            error_msg = f"Invalid date: '{raw_date}'"
        elif parsed_a is None:
            error_msg = "Invalid or missing amount"
        elif not raw_desc or not raw_desc.strip():
            error_msg = "Missing description"

        is_valid = error_msg is None
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        if len(sample_rows) < 25:
            sample_rows.append(CSVPreviewRow(
                row_number=row_num,
                raw_data=dict(row),
                parsed_date=parsed_d,
                parsed_description=raw_desc.strip() if raw_desc else None,
                parsed_merchant=raw_merchant.strip() if raw_merchant else None,
                parsed_amount=parsed_a,
                is_valid=is_valid,
                validation_error=error_msg
            ))

    return CSVPreviewResponse(
        filename=filename,
        total_detected_rows=row_num - 1,
        available_columns=fieldnames,
        suggested_mapping=mapping,
        sample_rows=sample_rows,
        valid_count=valid_count,
        invalid_count=invalid_count
    )
