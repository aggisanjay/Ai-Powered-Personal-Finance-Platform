from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas import UserCreate, UserLogin, Token, UserResponse
from backend.app.services.auth_service import register_user, authenticate_user
from backend.app.api.deps import get_current_user
from backend.app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else None
    return register_user(db, user_in, client_ip=client_ip)

@router.post("/login", response_model=Token)
def login(creds: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else None
    return authenticate_user(db, creds, client_ip=client_ip)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
