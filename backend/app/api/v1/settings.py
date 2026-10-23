from typing import List
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user
from backend.app.models import User, AuditEvent
from backend.app.schemas import AuditEventResponse
from backend.app.services.export_service import export_transactions_csv
from backend.app.services.audit_service import log_audit_event

router = APIRouter(prefix="/settings", tags=["Settings & Privacy"])

@router.get("/audit-events", response_model=List[AuditEventResponse])
def get_audit_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AuditEvent).filter(
        AuditEvent.user_id == current_user.id
    ).order_by(AuditEvent.timestamp.desc()).limit(100).all()

@router.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csv_data = export_transactions_csv(db, current_user.id)
    log_audit_event(
        db, current_user.id, "EXPORT_DATA", "User", str(current_user.id),
        details="Downloaded sanitized transactions CSV"
    )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=transactions_export_{current_user.id}.csv"
        }
    )

@router.delete("/account", status_code=status.HTTP_200_OK)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    db.delete(current_user)
    db.commit()
    return {"message": f"Account #{user_id} and all associated records permanently purged."}
