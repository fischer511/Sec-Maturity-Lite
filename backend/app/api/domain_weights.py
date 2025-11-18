from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field
import uuid

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.domain_weight import DomainWeight

router = APIRouter()


# Pydantic schemas
class DomainWeightCreate(BaseModel):
    domain: str
    weight: float = Field(ge=0.0, le=10.0, description="Weight must be between 0 and 10")
    description: str | None = None


class DomainWeightUpdate(BaseModel):
    weight: float = Field(ge=0.0, le=10.0, description="Weight must be between 0 and 10")
    description: str | None = None


class DomainWeightResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    domain: str
    weight: float
    description: str | None
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[DomainWeightResponse])
def list_domain_weights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all domain weights for the user's organization"""
    weights = db.query(DomainWeight).filter(
        DomainWeight.org_id == current_user.org_id
    ).all()
    
    return weights


@router.post("", response_model=DomainWeightResponse, status_code=201)
def create_domain_weight(
    weight_data: DomainWeightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new domain weight"""
    # Check if weight already exists for this domain
    existing = db.query(DomainWeight).filter(
        DomainWeight.org_id == current_user.org_id,
        DomainWeight.domain == weight_data.domain
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Weight for domain '{weight_data.domain}' already exists"
        )
    
    # Create new weight
    new_weight = DomainWeight(
        org_id=current_user.org_id,
        domain=weight_data.domain,
        weight=weight_data.weight,
        description=weight_data.description
    )
    
    db.add(new_weight)
    db.commit()
    db.refresh(new_weight)
    
    return new_weight


@router.put("/{weight_id}", response_model=DomainWeightResponse)
def update_domain_weight(
    weight_id: uuid.UUID,
    weight_data: DomainWeightUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing domain weight"""
    weight = db.query(DomainWeight).filter(
        DomainWeight.id == weight_id,
        DomainWeight.org_id == current_user.org_id
    ).first()
    
    if not weight:
        raise HTTPException(status_code=404, detail="Domain weight not found")
    
    weight.weight = weight_data.weight
    if weight_data.description is not None:
        weight.description = weight_data.description
    
    db.commit()
    db.refresh(weight)
    
    return weight


@router.delete("/{weight_id}", status_code=204)
def delete_domain_weight(
    weight_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a domain weight (resets to default weight of 1.0)"""
    weight = db.query(DomainWeight).filter(
        DomainWeight.id == weight_id,
        DomainWeight.org_id == current_user.org_id
    ).first()
    
    if not weight:
        raise HTTPException(status_code=404, detail="Domain weight not found")
    
    db.delete(weight)
    db.commit()
    
    return None


@router.post("/initialize-defaults", status_code=201)
def initialize_default_weights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize default weights (1.0) for all 10 domains"""
    domains = [
        ("governance", "Governance & Risk Management"),
        ("access_control", "Access Control & Identity Management"),
        ("data_protection", "Data Protection & Privacy"),
        ("network_security", "Network Security"),
        ("endpoint_security", "Endpoint Security"),
        ("app_security", "Application Security"),
        ("incident_response", "Incident Response & Recovery"),
        ("compliance", "Compliance & Legal"),
        ("awareness_training", "Security Awareness & Training"),
        ("physical_security", "Physical Security")
    ]
    
    created_weights = []
    
    for domain_code, domain_name in domains:
        # Check if weight already exists
        existing = db.query(DomainWeight).filter(
            DomainWeight.org_id == current_user.org_id,
            DomainWeight.domain == domain_code
        ).first()
        
        if not existing:
            weight = DomainWeight(
                org_id=current_user.org_id,
                domain=domain_code,
                weight=1.0,
                description=domain_name
            )
            db.add(weight)
            created_weights.append(weight)
    
    db.commit()
    
    return {
        "message": f"Initialized {len(created_weights)} default domain weights",
        "created_count": len(created_weights)
    }
