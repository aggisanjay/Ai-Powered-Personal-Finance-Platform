import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend' package resolves seamlessly
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.api.v1 import (
    auth, accounts, categories, rules, transactions,
    budgets, imports, receipts, analytics, assistant, settings as app_settings
)

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Secure, production-ready AI-powered personal finance and budgeting platform."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(accounts.router, prefix=api_prefix)
app.include_router(categories.router, prefix=api_prefix)
app.include_router(rules.router, prefix=api_prefix)
app.include_router(transactions.router, prefix=api_prefix)
app.include_router(budgets.router, prefix=api_prefix)
app.include_router(imports.router, prefix=api_prefix)
app.include_router(receipts.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)
app.include_router(app_settings.router, prefix=api_prefix)

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }

@app.get("/")
def root():
    return {
        "message": "AI-Powered Personal Finance Platform API is active.",
        "documentation": "/docs"
    }
