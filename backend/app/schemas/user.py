from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional


class UserRole(str):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: str = "viewer"
    org_id: Optional[UUID4] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserResponse(UserBase):
    id: UUID4
    role: str
    org_id: Optional[UUID4]
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrgBase(BaseModel):
    name: str


class OrgCreate(OrgBase):
    pass


class OrgUpdate(BaseModel):
    name: Optional[str] = None


class OrgResponse(OrgBase):
    id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True
