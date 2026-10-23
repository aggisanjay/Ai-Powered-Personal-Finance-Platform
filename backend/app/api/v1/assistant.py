from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User
from backend.app.schemas import AssistantQueryRequest, AssistantQueryResponse
from backend.app.ai.assistant import query_grounded_assistant

router = APIRouter(prefix="/assistant", tags=["Natural Language Assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
def ask_finance_assistant(
    req: AssistantQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return query_grounded_assistant(
        db=db,
        user_id=current_user.id,
        question=req.question,
        explicit_period=req.period_month
    )
