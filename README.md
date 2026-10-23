# Aura Finance — AI-Powered Personal Finance Platform

[![Python](https://img.shields.io/badge/Python-3.12%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

A production-grade, secure, multi-tenant personal finance workspace built with **FastAPI**, **PostgreSQL** (with local SQLite fallback), **Google Gemini AI**, and **React 19 + TypeScript + Tailwind CSS 4**. Designed around the warm, spacious, modern **Elevate visual identity** and engineered with **deterministic financial arithmetic** (zero floating-point errors) and **real-time AI execution telemetry** (latency, cost, token usage, and model source).

---

## 📑 Table of Contents

- [Core Principles](#-core-principles)
- [Key Features](#-key-features)
- [AI Architecture & Real-Time Telemetry](#-ai-architecture--real-time-telemetry)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Docker Setup](#docker-setup)
- [Database Configuration & Seeding](#-database-configuration--seeding)
- [API Reference](#-api-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Compliance](#-security--compliance)
- [Design System](#-design-system)

---

## 💡 Core Principles

1. **Deterministic Precision over Generative Guesswork:**
   All financial metrics, budgets, sums, and month-over-month variances are calculated using Python's `Decimal` module and stored in SQL `NUMERIC(14, 2)` columns. Generative AI is never permitted to perform unverified mental arithmetic.
2. **Strict Multi-Tenant Row-Level Isolation:**
   Every query explicitly scopes data access to `current_user.id`. Cross-user data leakage is structurally impossible at both ORM and route levels.
3. **Grounded AI Financial Assistant with Complete Telemetry:**
   Natural language queries submitted to the assistant combine verified SQL facts with Google Gemini cloud intelligence. Every response provides real-time telemetry metrics: latency (ms), token usage, estimated cost (USD), and model source.
4. **Formula Injection & Security Defense:**
   All exported CSV reports escape dangerous formula prefixes (`=`, `+`, `-`, `@`) with single quotes to prevent CSV injection vulnerabilities in Excel or Google Sheets.

---

## ✨ Key Features

- **Executive Financial Overview:** Real-time net worth calculation, active account balances, monthly cash flow summaries, spending trend charts, and recent transaction audit logs.
- **Statement Import Wizard:** Automated column detection for CSV statement ingestion with flexible date parsing (`YYYY-MM-DD`, `MM/DD/YYYY`, timestamps), signed vs. debit/credit splitting, and 1-click column auto-alignment.
- **Budget Management:** Category-level budget thresholds, progress indicators, over-budget notifications, and unbudgeted category quick-add modal.
- **Spending Trends & Pattern Analytics:** Interactive category breakdown donut chart, Month-over-Month movers (Largest Increase & Largest Decrease), and detailed breakdown tables.
- **Recurring Expenses & Subscription Tracker:** Heuristic cycle analyzer (~30-day and ~7-day intervals) and high-confidence subscription keyword detection.
- **Duplicate Charge Auditor:** Flags potential double billings (identical amounts to the same merchant within 3 days) with interactive resolution actions (*Confirm Duplicate* / *Distinct Charges*).
- **Prioritized Categorization Rules Engine:** User-defined rules evaluated in priority order to categorize incoming transactions deterministically.
- **Receipts & OCR Processing:** Upload receipt files (PNG, JPG, PDF) with extracted merchant, date, and amount field review before committing to the ledger.
- **AI Finance Assistant with Live Telemetry:** Plain English query engine providing verified facts, supporting ledger citations, and execution telemetry (latency, token breakdown, estimated cost, and model origin).
- **Settings & Audit Trail:** Profile management, comprehensive audit event history, sanitized CSV statement export, and permanent account deletion.

---

## 🤖 AI Architecture & Real-Time Telemetry

The platform uses a **Grounded Hybrid Architecture** to prevent hallucinations:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant API as FastAPI Backend
    participant Calc as Deterministic Engine (SQL + Decimal)
    participant AI as Gemini Cloud Engine
    participant DB as Stored Ledger DB

    User->>API: POST /api/v1/assistant/query ("How much did I spend on groceries in Oct?")
    API->>Calc: Extract intent & compute exact metrics
    Calc->>DB: Query user-scoped records & category aggregates
    DB-->>Calc: Verified transaction facts ($420.50 across 12 txs)
    Calc-->>API: Parametric facts + Supporting transaction IDs
    API->>AI: Synthesize explanation using facts prompt (Gemini Flash Lite)
    AI-->>API: Natural language explanation + usageMetadata
    API->>API: Measure latency (ms), compute tokens & cost ($USD)
    API-->>User: AssistantQueryResponse (Explanation + Citations + Telemetry)
```

### Telemetry Metrics Returned on Every AI Query

| Metric | Field | Description | Example |
| :--- | :--- | :--- | :--- |
| **Latency** | `latency_ms` | Round-trip execution time measured via `time.perf_counter()` | `2891 ms` |
| **Tokens** | `total_tokens` | Total tokens consumed (`prompt_tokens` in + `completion_tokens` out) | `132 (81 in / 51 out)` |
| **Cost** | `cost_usd` | Estimated USD API cost computed from standard model token pricing | `$0.000021` |
| **Source Engine** | `model_source` | Active model tier or automated offline fallback engine | `Gemini Flash Lite (Cloud Grounded)` |

> [!NOTE]
> If `GEMINI_API_KEY` is absent or the cloud API experiences upstream rate limits, the assistant automatically falls back to the **Grounded Financial AI Engine (Safe Fallback)**, ensuring the chat interface never hangs or errors.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client["React 19 + TypeScript (Elevate UI)"]
    API["FastAPI Backend (REST API)"]
    Auth["JWT Bearer + Argon2id Hash"]
    Services["Domain Services (Rules, Ingestion, OCR, Audit)"]
    Calc["Deterministic Analytics Engine (Decimal Math)"]
    LLM["AI Engine (Gemini / Telemetry Tracker)"]
    DB[(PostgreSQL / SQLite)]

    Client -->|HTTPS / JSON| API
    API --> Auth
    API --> Services
    API --> Calc
    API --> LLM
    Services --> DB
    Calc --> DB
```

---

## 📂 Repository Structure

```text
Ai-Powered-Personal-Finance-Platform/
├── backend/
│   ├── app/
│   │   ├── ai/               # Grounded assistant & Gemini LLM synthesis client
│   │   ├── analytics/        # Decimal arithmetic, trends, recurring & duplicate detectors
│   │   ├── api/              # FastAPI route controllers (v1)
│   │   │   └── v1/           # auth, accounts, transactions, budgets, analytics, imports, receipts, rules, assistant, settings
│   │   ├── core/             # Configuration, database engine, security & JWT utilities
│   │   ├── ingestion/        # CSV parser, column auto-detector, flexible date parser
│   │   ├── models/           # SQLAlchemy database entity models
│   │   ├── schemas/          # Pydantic validation request/response schemas
│   │   ├── services/         # Categorization rules engine, audit logger, auth services
│   │   ├── main.py           # Application entrypoint & CORS middleware
│   │   └── seed.py           # Database demo seed script (multi-month, recurring, duplicates)
│   ├── requirements.txt      # Python dependencies
│   └── tests/                # Pytest integration & functional test suite
├── frontend/
│   ├── src/
│   │   ├── components/       # UI Pages: Dashboard, Budgets, Analytics, Imports, Receipts, Rules, Assistant, Settings
│   │   ├── context/          # React authentication context
│   │   ├── api.ts            # Typed Axios REST API client
│   │   ├── types.ts          # TypeScript domain interfaces
│   │   ├── App.tsx           # Sticky sidebar navigation & view layout
│   │   ├── main.tsx          # React application root
│   │   └── index.css         # Elevate theme styles & Tailwind tokens
│   ├── package.json
│   └── vite.config.ts
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules for Python, Node, DB & secrets
├── docker-compose.yml        # Docker orchestration file
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.12 or newer
- **Node.js**: 20.x or newer & `npm`
- **Database**: PostgreSQL (recommended, e.g. [Neon](https://neon.tech)) or local SQLite fallback
- **AI Key (Optional)**: Google Gemini API key (`GEMINI_API_KEY`) for cloud LLM synthesis

---

### Backend Setup

1. **Create and activate a virtual environment:**
   ```powershell
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r backend/requirements.txt pytest
   ```

3. **Configure environment variables:**
   ```powershell
   # Copy template to .env
   cp .env.example .env
   ```
   Add your database connection string and optional Gemini API key:
   ```env
   DATABASE_URL="postgresql://neondb_owner:password@ep-host.region.aws.neon.tech/neondb?sslmode=require"
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

4. **Seed demo data (Optional but recommended):**
   ```powershell
   # Windows PowerShell
   $env:PYTHONPATH="."
   python backend/app/seed.py

   # macOS / Linux
   PYTHONPATH=. python backend/app/seed.py
   ```
   *Creates demo user: `demo@finance.ai` / `DemoPassword123!` with multi-month transactions, budgets, recurring subscriptions, and duplicate audit candidates.*

5. **Start the FastAPI backend server:**
   ```powershell
   # Windows PowerShell
   $env:PYTHONPATH="."
   uvicorn backend.app.main:app --reload --port 8000

   # macOS / Linux
   PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000
   ```
   - **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
   - **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### Frontend Setup

1. **Navigate to the frontend directory and install packages:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open **`http://localhost:5173`** in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

---

### Docker Setup

Run the entire platform with Docker Compose:

```bash
docker-compose up --build
```
Access the web frontend at `http://localhost:3000`.

---

## 🗄️ Database Configuration & Seeding

The platform uses SQLAlchemy 2.0 and supports both PostgreSQL and SQLite out-of-the-box:

```env
# Remote PostgreSQL (Production / Neon Cloud):
DATABASE_URL="postgresql://neondb_owner:password@ep-host.region.aws.neon.tech/neondb?sslmode=require"

# Local SQLite (Zero-configuration fallback):
DATABASE_URL="sqlite:///./finance.db"
```

### Seed Data Features
Running `python backend/app/seed.py` creates:
- **Accounts:** Chase Total Checking ($4,250.80), Sapphire Reserve Credit (-$1,230.45), Marcus High-Yield Savings ($15,800.00).
- **Categories & Rules:** 12 standardized categories with automated regex pattern matching.
- **Multi-Month Budgets:** Baseline budgets for both October and September 2026.
- **Transactions:** 30+ transactions across September and October 2026.
- **Analytics Data:** Demonstrates MoM expense increases, decreases (-$900 Entertainment decrease), 13 active recurring subscriptions, and a flagged duplicate charge for auditor testing.

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/auth/login`.

| Group | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Create a new user account |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token |
| **Auth** | `GET` | `/api/v1/auth/me` | Fetch active user profile |
| **Accounts** | `GET` | `/api/v1/accounts/` | List all user financial accounts |
| **Accounts** | `POST` | `/api/v1/accounts/` | Create a new financial account |
| **Transactions** | `GET` | `/api/v1/transactions/` | Paginated and filtered transaction search |
| **Transactions** | `POST` | `/api/v1/transactions/` | Record a manual transaction |
| **Budgets** | `GET` | `/api/v1/budgets/comparison` | Budget vs. actual spending by category |
| **Budgets** | `POST` | `/api/v1/budgets/` | Set or adjust category budget limits |
| **Analytics** | `GET` | `/api/v1/analytics/monthly-summary` | Net cash flow, income, expenses & savings rate |
| **Analytics** | `GET` | `/api/v1/analytics/category-trends` | Category distribution & MoM spending movers |
| **Analytics** | `GET` | `/api/v1/analytics/recurring-expenses` | List detected recurring subscriptions |
| **Analytics** | `GET` | `/api/v1/analytics/duplicates` | Retrieve candidate duplicate charges |
| **Analytics** | `POST` | `/api/v1/analytics/duplicates/{id}/resolve` | Confirm duplicate or mark distinct |
| **Imports** | `POST` | `/api/v1/imports/preview` | Upload statement CSV and inspect sample rows |
| **Imports** | `POST` | `/api/v1/imports/confirm` | Ingest mapped statement records into ledger |
| **Receipts** | `POST` | `/api/v1/receipts/upload` | Upload receipt image/PDF for OCR extraction |
| **Receipts** | `POST` | `/api/v1/receipts/{id}/confirm` | Convert verified receipt into ledger transaction |
| **Rules** | `GET` | `/api/v1/rules/` | List prioritized categorization rules |
| **Rules** | `POST` | `/api/v1/rules/` | Create prioritized rule with dry-run preview |
| **Assistant** | `POST` | `/api/v1/assistant/query` | Ask grounded natural-language financial questions (with AI telemetry) |
| **Settings** | `GET` | `/api/v1/settings/audit-logs` | Retrieve chronological user action log |
| **Settings** | `GET` | `/api/v1/settings/export/csv` | Export sanitized CSV statement |
| **Settings** | `DELETE`| `/api/v1/settings/account` | Permanently wipe user account and all financial data |

---

## 🧪 Testing & Quality Assurance

### Running Backend Tests
The backend test suite validates authentication, row-level tenant isolation, deterministic arithmetic, budget comparisons, and grounded query verification:

```powershell
# Windows PowerShell
$env:PYTHONPATH="."
pytest backend/tests -v

# macOS / Linux
PYTHONPATH=. pytest backend/tests -v
```

### Running Frontend Typechecks & Bundle Build
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Compliance

- **Argon2id Password Hashing:** Industry-standard password hashing through `pwdlib` and `passlib`.
- **JWT Cryptographic Signatures:** Standard HS256 authentication tokens with configurable expiration.
- **Zero Banking Login Credentials:** The platform does not request, store, or handle third-party banking credentials. Ingestion is completed via user-controlled CSV statements and receipts.
- **CSV Formula Injection Mitigation:** Sanitizes leading characters (`=`, `+`, `-`, `@`) with a prepended single-quote (`'`) on data export.
- **Deterministic Arithmetic:** Guaranteed absence of floating-point arithmetic errors via Python's native `Decimal` and SQL `NUMERIC(14, 2)`.
- **AI Safety & Zero Hallucination:** Computations are performed deterministically in SQL/Python before prompting the LLM. The AI only synthesizes the final explanatory prose.

---

## 🎨 Design System

Built adhering to the **Elevate Aesthetic Standards**:
- **Background:** Warm Cream (`#FFFCF5`)
- **Cards & Surfaces:** Pure White (`#FFFFFF`) with Pale Yellow (`#FFF0C9`) and Warm Neutral borders (`#E9E1D5`)
- **Primary Actions:** Solid Ink Black (`#080808` / `#111111`) with Crisp White Text
- **Accent Details:** Subtle Warm Orange (`#FF6908`) and Forest Green (`#287650`)
- **Typography:** Modern clean sans-serif with monospace styling for financial balances and tabular figures.

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
