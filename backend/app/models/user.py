import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    org = relationship("Org", back_populates="users")
    team = relationship("Team", back_populates="users")
    assessments_created = relationship("Assessment", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="actor")
    assigned_tasks = relationship("RemediationTask", foreign_keys="RemediationTask.assignee_id", back_populates="assignee")
    created_tasks = relationship("RemediationTask", foreign_keys="RemediationTask.created_by_id", back_populates="created_by")
