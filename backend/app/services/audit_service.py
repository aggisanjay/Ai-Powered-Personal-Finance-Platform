from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models import AuditEvent

def log_audit_event(
    db: Session,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditEvent:
    """Record an audit event without storing sensitive passwords or financial secrets."""
    event = AuditEvent(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
