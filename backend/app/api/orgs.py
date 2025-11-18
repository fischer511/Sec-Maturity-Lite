from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.deps import get_db, get_current_user, get_current_admin
from app.schemas.user import OrgCreate, OrgResponse, OrgUpdate
from app.schemas.team import TeamCreate, TeamResponse
from app.models.org import Org
from app.models.team import Team
from app.models.user import User
from app.utils.audit import log_audit

router = APIRouter(prefix="/orgs", tags=["orgs"])


@router.post("", response_model=OrgResponse, dependencies=[Depends(get_current_admin)])
def create_org(org_data: OrgCreate, db: Session = Depends(get_db)):
    """Create a new organization (admin only)."""
    org = Org(name=org_data.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    return org


@router.get("", response_model=List[OrgResponse], dependencies=[Depends(get_current_admin)])
def list_orgs(db: Session = Depends(get_db)):
    """List all organizations (admin only)."""
    orgs = db.query(Org).all()
    return orgs


@router.get("/{org_id}", response_model=OrgResponse)
def get_org(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get organization by ID."""
    org = db.query(Org).filter(Org.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Check access: admin or member of org
    if current_user.role != "admin" and current_user.org_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return org


@router.patch("/{org_id}", response_model=OrgResponse, dependencies=[Depends(get_current_admin)])
def update_org(
    org_id: UUID,
    update_data: OrgUpdate,
    db: Session = Depends(get_db),
):
    """Update organization (admin only)."""
    org = db.query(Org).filter(Org.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    if update_data.name is not None:
        org.name = update_data.name
    
    db.commit()
    db.refresh(org)
    
    return org


@router.get("/{org_id}/teams", response_model=List[TeamResponse])
def list_teams(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all teams in organization."""
    # Check access
    if current_user.role != "admin" and current_user.org_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    teams = db.query(Team).filter(Team.org_id == org_id).all()
    return teams


@router.post("/{org_id}/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    org_id: UUID,
    team_data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new team in organization."""
    # Check org exists
    org = db.query(Org).filter(Org.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Check access - only admin or manager from same org
    if current_user.role not in ["admin", "manager"] or (
        current_user.role == "manager" and current_user.org_id != org_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    team = Team(
        org_id=org_id,
        name=team_data.name,
        description=team_data.description,
    )
    db.add(team)
    
    log_audit(
        db,
        action="team.created",
        actor_user=current_user,
        org_id=org_id,
        meta={"team_id": str(team.id), "name": team.name},
    )
    
    db.commit()
    db.refresh(team)
    
    return team
