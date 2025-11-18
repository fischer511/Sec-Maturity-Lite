from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.core.deps import get_db, get_current_admin
from app.schemas.audit import AuditLogResponse
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=List[AuditLogResponse], dependencies=[Depends(get_current_admin)])
def list_audit_logs(
    actor_user_id: Optional[UUID] = None,
    org_id: Optional[UUID] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List audit logs with optional filters (admin only)."""
    query = db.query(AuditLog)
    
    if actor_user_id:
        query = query.filter(AuditLog.actor_user_id == actor_user_id)
    if org_id:
        query = query.filter(AuditLog.org_id == org_id)
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()
    
    return logs
