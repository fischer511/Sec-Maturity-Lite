import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Org(Base):
    __tablename__ = "orgs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="org")
    teams = relationship("Team", back_populates="org", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="org")
    audit_logs = relationship("AuditLog", back_populates="org")
    tasks = relationship("RemediationTask", back_populates="org")
    import_logs = relationship("ImportLog", back_populates="org")
    domain_weights = relationship("DomainWeight", back_populates="org", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="org", cascade="all, delete-orphan")
