"""Audit logging helpers."""
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User
from typing import Optional, Any
from uuid import UUID


def log_audit(
    db: Session,
    action: str,
    actor_user: Optional[User] = None,
    org_id: Optional[UUID] = None,
    meta: Optional[dict[str, Any]] = None,
):
    """Create an audit log entry."""
    audit = AuditLog(
        actor_user_id=actor_user.id if actor_user else None,
        org_id=org_id,
        action=action,
        meta=meta,
    )
    db.add(audit)
