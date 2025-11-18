from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user, get_current_admin
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse, dependencies=[Depends(get_current_admin)])
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user (admin only)."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        org_id=user_data.org_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    if update_data.email is not None:
        current_user.email = update_data.email
    if update_data.password is not None:
        current_user.password_hash = get_password_hash(update_data.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
