"""
Pydantic schemas for remediation tasks.
"""
from pydantic import BaseModel, UUID4, Field
from datetime import datetime
from typing import Optional
from app.models.remediation_task import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """Base task fields."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    domain: Optional[str] = None
    recommendation_id: Optional[str] = None
    assignee_id: Optional[UUID4] = None
    priority: TaskPriority = TaskPriority.medium
    deadline: Optional[datetime] = None


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    assessment_id: UUID4
    status: TaskStatus = TaskStatus.todo


class TaskUpdate(BaseModel):
    """Schema for updating a task (all fields optional)."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    assignee_id: Optional[UUID4] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: UUID4
    assessment_id: UUID4
    org_id: UUID4
    created_by_id: UUID4
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskWithAssignee(TaskResponse):
    """Task response with assignee details."""
    assignee_email: Optional[str] = None
    created_by_email: str
    
    class Config:
        from_attributes = True


class TaskStatistics(BaseModel):
    """Statistics for tasks."""
    total: int
    todo: int
    in_progress: int
    completed: int
    cancelled: int
    overdue: int
    by_priority: dict[str, int]
