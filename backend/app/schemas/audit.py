from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, Any


class AuditLogResponse(BaseModel):
    id: UUID4
    actor_user_id: Optional[UUID4]
    org_id: Optional[UUID4]
    action: str
    meta: Optional[Any]
    created_at: datetime
    
    class Config:
        from_attributes = True
