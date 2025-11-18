from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.org import Org
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate
from app.utils.audit import log_audit


router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get team by ID."""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    
    # Check access - user must be from same org
    if current_user.role != "admin" and current_user.org_id != team.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return team


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    
    # Only admin or manager from same org can update
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and current_user.org_id != team.org_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Update fields
    if team_data.name is not None:
        team.name = team_data.name
    if team_data.description is not None:
        team.description = team_data.description
    
    log_audit(
        db,
        action="team.updated",
        actor_user=current_user,
        org_id=team.org_id,
        meta={"team_id": str(team.id), "name": team.name},
    )
    
    db.commit()
    db.refresh(team)
    
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    
    # Only admin or manager from same org can delete
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and current_user.org_id != team.org_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    log_audit(
        db,
        action="team.deleted",
        actor_user=current_user,
        org_id=team.org_id,
        meta={"team_id": str(team.id), "name": team.name},
    )
    
    db.delete(team)
    db.commit()
