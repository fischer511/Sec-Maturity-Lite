"""
Task API endpoints for remediation plan management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from pydantic import UUID4

from app.core.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.remediation_task import RemediationTask, TaskStatus, TaskPriority
from app.models.assessment import Assessment
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskWithAssignee, TaskStatistics
from app.utils.audit import log_audit

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new remediation task.
    
    - Requires: manager or admin role
    - Links task to assessment and organization
    """
    # Check access
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot create tasks",
        )
    
    # Verify assessment exists and user has access
    assessment = db.query(Assessment).filter(Assessment.id == task.assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check org access
    if current_user.role != UserRole.ADMIN and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Create task
    db_task = RemediationTask(
        assessment_id=task.assessment_id,
        org_id=assessment.org_id,
        title=task.title,
        description=task.description,
        domain=task.domain,
        recommendation_id=task.recommendation_id,
        assignee_id=task.assignee_id,
        created_by_id=current_user.id,
        status=task.status,
        priority=task.priority,
        deadline=task.deadline,
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Audit log
    log_audit(
        db=db,
        action="task.created",
        actor_user=current_user,
        org_id=assessment.org_id,
        meta={
            "task_id": str(db_task.id),
            "assessment_id": str(assessment.id),
            "title": task.title,
            "priority": task.priority.value,
        },
    )
    
    return db_task


@router.get("", response_model=List[TaskWithAssignee])
def list_tasks(
    assessment_id: Optional[UUID4] = Query(None),
    status_filter: Optional[TaskStatus] = Query(None),
    priority_filter: Optional[TaskPriority] = Query(None),
    assignee_id: Optional[UUID4] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List remediation tasks with filters.
    
    - Admin: see all tasks
    - Manager: see tasks in their org
    - Viewer: see tasks in their org
    """
    query = db.query(RemediationTask).options(
        joinedload(RemediationTask.assignee),
        joinedload(RemediationTask.created_by)
    )
    
    # Apply org filter for non-admins
    if current_user.role != UserRole.ADMIN:
        if not current_user.org_id:
            return []
        query = query.filter(RemediationTask.org_id == current_user.org_id)
    
    # Apply filters
    if assessment_id:
        query = query.filter(RemediationTask.assessment_id == assessment_id)
    
    if status_filter:
        query = query.filter(RemediationTask.status == status_filter)
    
    if priority_filter:
        query = query.filter(RemediationTask.priority == priority_filter)
    
    if assignee_id:
        query = query.filter(RemediationTask.assignee_id == assignee_id)
    
    # Order by priority (critical first) then deadline
    priority_order = {
        TaskPriority.critical: 1,
        TaskPriority.high: 2,
        TaskPriority.medium: 3,
        TaskPriority.low: 4,
    }
    
    tasks = query.all()
    
    # Sort in Python for complex logic
    tasks_sorted = sorted(
        tasks,
        key=lambda t: (priority_order.get(t.priority, 99), t.deadline or datetime.max),
    )
    
    # Add assignee and creator info
    result = []
    for task in tasks_sorted:
        # Convert task to dict
        task_data = {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "deadline": task.deadline,
            "recommendation_id": task.recommendation_id,
            "domain": task.domain,
            "assessment_id": str(task.assessment_id),
            "org_id": str(task.org_id),
            "created_by_id": str(task.created_by_id),
            "completed_at": task.completed_at,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "assignee_email": task.assignee.email if task.assignee else None,
            "created_by_email": task.created_by.email if task.created_by else "Unknown",
        }
        
        result.append(TaskWithAssignee(**task_data))
    
    return result


@router.get("/statistics", response_model=TaskStatistics)
def get_task_statistics(
    assessment_id: Optional[UUID4] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get task statistics for dashboard."""
    query = db.query(RemediationTask)
    
    # Apply org filter for non-admins
    if current_user.role != UserRole.ADMIN:
        if not current_user.org_id:
            return TaskStatistics(
                total=0, todo=0, in_progress=0, completed=0, cancelled=0,
                overdue=0, by_priority={}
            )
        query = query.filter(RemediationTask.org_id == current_user.org_id)
    
    if assessment_id:
        query = query.filter(RemediationTask.assessment_id == assessment_id)
    
    tasks = query.all()
    
    now = datetime.utcnow()
    stats = {
        "total": len(tasks),
        "todo": sum(1 for t in tasks if t.status == TaskStatus.todo),
        "in_progress": sum(1 for t in tasks if t.status == TaskStatus.in_progress),
        "completed": sum(1 for t in tasks if t.status == TaskStatus.completed),
        "cancelled": sum(1 for t in tasks if t.status == TaskStatus.cancelled),
        "overdue": sum(1 for t in tasks if t.deadline and t.deadline < now and t.status not in [TaskStatus.completed, TaskStatus.cancelled]),
        "by_priority": {
            "low": sum(1 for t in tasks if t.priority == TaskPriority.low),
            "medium": sum(1 for t in tasks if t.priority == TaskPriority.medium),
            "high": sum(1 for t in tasks if t.priority == TaskPriority.high),
            "critical": sum(1 for t in tasks if t.priority == TaskPriority.critical),
        },
    }
    
    return TaskStatistics(**stats)


@router.get("/{task_id}", response_model=TaskWithAssignee)
def get_task(
    task_id: UUID4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get task by ID."""
    task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Check access
    if current_user.role != UserRole.ADMIN and current_user.org_id != task.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    task_dict = TaskWithAssignee.model_validate(task).model_dump()
    
    if task.assignee:
        task_dict["assignee_email"] = task.assignee.email
    
    if task.created_by:
        task_dict["created_by_email"] = task.created_by.email
    
    return TaskWithAssignee(**task_dict)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID4,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a task.
    
    - Requires: manager or admin role
    - Viewers can only update tasks assigned to them
    """
    task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Check access
    if current_user.role == UserRole.VIEWER:
        # Viewers can only update their own assigned tasks
        if task.assignee_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update tasks assigned to you",
            )
    elif current_user.role != UserRole.ADMIN and current_user.org_id != task.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Update fields
    update_data = task_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Auto-set completed_at when status changes to completed
    if task_update.status == TaskStatus.completed and not task.completed_at:
        task.completed_at = datetime.utcnow()
    
    # Clear completed_at if status changes from completed
    if task_update.status and task_update.status != TaskStatus.completed:
        task.completed_at = None
    
    task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    
    # Audit log
    log_audit(
        db=db,
        action="task.updated",
        actor_user=current_user,
        org_id=task.org_id,
        meta={
            "task_id": str(task.id),
            "updated_fields": list(update_data.keys()),
        },
    )
    
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a task.
    
    - Requires: manager or admin role
    """
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot delete tasks",
        )
    
    task = db.query(RemediationTask).filter(RemediationTask.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Check access
    if current_user.role != UserRole.ADMIN and current_user.org_id != task.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Audit log before deletion
    log_audit(
        db=db,
        action="task.deleted",
        actor_user=current_user,
        org_id=task.org_id,
        meta={
            "task_id": str(task.id),
            "title": task.title,
        },
    )
    
    db.delete(task)
    db.commit()
    
    return None
