"""
RemediationTask model for tracking action items from recommendations.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    """Task status enum."""
    todo = "todo"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class TaskPriority(str, enum.Enum):
    """Task priority enum."""
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RemediationTask(Base):
    """
    Represents a remediation task/action item.
    
    Tasks can be created from recommendations or manually.
    Tracks who is responsible, deadline, and completion status.
    """
    __tablename__ = "remediation_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=False)
    
    # Optional link to recommendation that spawned this task
    recommendation_id = Column(String(50), nullable=True)  # e.g., "GOV-01"
    domain = Column(String(50), nullable=True)  # e.g., "governance"
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Assignment
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Status and priority
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.todo, nullable=False)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.medium, nullable=False)
    
    # Dates
    deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="tasks")
    org = relationship("Org", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_tasks")
