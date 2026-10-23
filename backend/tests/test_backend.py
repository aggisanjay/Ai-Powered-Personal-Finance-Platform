import pytest
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models import User, FinancialAccount, Transaction, Category
from backend.app.ingestion.csv_parser import parse_flexible_date, parse_flexible_amount, preview_csv_content
from backend.app.services.export_service import sanitize_csv_cell
from backend.app.seed import seed_demo_data

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database schema is created and demo seed data is populated for tests."""
    Base.metadata.create_all(bind=engine)
    seed_demo_data()

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_auth_and_isolation():
    import uuid
    # Register user A
    user_a_email = f"usera_{uuid.uuid4().hex[:8]}@test.com"
    resp_a = client.post("/api/v1/auth/register", json={
        "email": user_a_email,
        "password": "Password123!",
        "full_name": "User Alpha",
        "currency_code": "USD"
    })
    assert resp_a.status_code == 200
    token_a = resp_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register user B
    user_b_email = f"userb_{uuid.uuid4().hex[:8]}@test.com"
    resp_b = client.post("/api/v1/auth/register", json={
        "email": user_b_email,
        "password": "Password123!",
        "full_name": "User Beta",
        "currency_code": "USD"
    })
    assert resp_b.status_code == 200
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an account and transaction
    accounts_a = client.get("/api/v1/accounts", headers=headers_a).json()
    assert len(accounts_a) >= 1
    acc_id_a = accounts_a[0]["id"]

    tx_resp = client.post("/api/v1/transactions", headers=headers_a, json={
        "account_id": acc_id_a,
        "transaction_date": "2026-10-15",
        "description": "Alpha Secret Expense",
        "merchant": "Alpha Merchant",
        "amount": "-55.00",
        "currency": "USD"
    })
    assert tx_resp.status_code == 201
    tx_a_id = tx_resp.json()["id"]

    # Security check: User B CANNOT see User A's transaction
    txs_b = client.get("/api/v1/transactions", headers=headers_b).json()
    for t in txs_b:
        assert t["id"] != tx_a_id

    # Security check: User B cannot modify or delete User A's transaction
    del_resp = client.delete(f"/api/v1/transactions/{tx_a_id}", headers=headers_b)
    assert del_resp.status_code == 404

def test_csv_parser_and_injection_defense():
    csv_sample = b"""Date,Description,Amount\n2026-10-01,Grocery Store,-45.50\n10/02/2026,Salary Deposit,3000.00\n"""
    preview = preview_csv_content(csv_sample, "test_statement.csv")
    assert preview.total_detected_rows == 2
    assert preview.valid_count == 2
    assert preview.sample_rows[0].parsed_amount == Decimal("-45.50")
    assert preview.sample_rows[1].parsed_amount == Decimal("3000.00")

    # Formula injection defense test
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-25.00") == "'-25.00"
    assert sanitize_csv_cell("@SUM(1,2)") == "'@SUM(1,2)"
    assert sanitize_csv_cell("Normal Text") == "Normal Text"

def test_deterministic_analytics():
    # Login as demo user
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "demo@finance.ai",
        "password": "DemoPassword123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    summary = client.get("/api/v1/analytics/monthly-summary?period_month=2026-10", headers=headers).json()
    assert summary["period_month"] == "2026-10"
    assert float(summary["total_income"]) > 0
    assert float(summary["total_expenses"]) > 0
    assert summary["transaction_count"] > 0

    trends = client.get("/api/v1/analytics/category-trends?period_month=2026-10", headers=headers).json()
    assert len(trends["categories"]) > 0

    budgets = client.get("/api/v1/budgets/comparison?period_month=2026-10", headers=headers).json()
    assert len(budgets["items"]) > 0

    assistant_resp = client.post("/api/v1/assistant/query", headers=headers, json={
        "question": "How much did I spend on groceries in October 2026?"
    }).json()
    assert "groceries" in assistant_resp["explanation"].lower() or "spent" in assistant_resp["explanation"].lower()
    assert len(assistant_resp["supporting_transactions"]) > 0
