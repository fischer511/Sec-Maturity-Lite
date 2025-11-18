from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TeamResponse(TeamBase):
    id: UUID4
    org_id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True
