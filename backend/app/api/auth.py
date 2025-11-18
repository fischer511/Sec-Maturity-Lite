from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserResponse
from app.models.user import User, UserRole
from app.models.org import Org
from app.core.deps import get_current_user
from app.utils.audit import log_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        # Audit failed login
        log_audit(
            db,
            action="auth.login_failed",
            meta={"email": request.email},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Audit successful login
    log_audit(
        db,
        action="auth.login_success",
        actor_user=user,
        org_id=user.org_id,
        meta={"email": user.email},
    )
    db.commit()
    
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user and optionally create an organization."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create organization if provided
    org_id = None
    if request.org_name:
        org = Org(name=request.org_name)
        db.add(org)
        db.flush()  # Get the org ID
        org_id = org.id
    
    # Create user with hashed password
    new_user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=UserRole.ADMIN if org_id else UserRole.VIEWER,  # Admin if creating org
        org_id=org_id,
    )
    db.add(new_user)
    db.flush()
    
    # Create access token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    # Audit log
    log_audit(
        db,
        action="auth.register_success",
        actor_user=new_user,
        org_id=org_id,
        meta={"email": new_user.email, "org_created": bool(org_id)},
    )
    db.commit()
    
    return TokenResponse(access_token=access_token)
