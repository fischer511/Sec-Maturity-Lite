"""
Document API endpoints for evidence library.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pathlib import Path
import shutil
import uuid
from datetime import datetime

from app.core.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.document import Document, DocumentCategory
from app.schemas.document import DocumentResponse, DocumentWithUploader, DocumentUpdate
from app.utils.audit import log_audit

router = APIRouter(prefix="/documents", tags=["documents"])

# Upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Maximum file size: 50 MB
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: DocumentCategory = Form(...),
    description: Optional[str] = Form(None),
    assessment_id: Optional[str] = Form(None),
    domain: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a new document.
    
    - Managers and Admins can upload documents
    - Files are stored on disk with unique names
    - Metadata is stored in database
    """
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot upload documents"
        )
    
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE / (1024*1024):.0f} MB"
        )
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / str(current_user.org_id) / unique_filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save file to disk
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create database record
    document = Document(
        org_id=current_user.org_id,
        title=title,
        description=description,
        category=category,
        filename=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        mime_type=file.content_type,
        assessment_id=assessment_id if assessment_id else None,
        domain=domain,
        uploaded_by_id=current_user.id,
        tags=tags,
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    log_audit(
        db=db,
        user_id=current_user.id,
        org_id=current_user.org_id,
        action="document_upload",
        resource_type="document",
        resource_id=document.id,
        details=f"Uploaded document: {title} ({file.filename})"
    )
    
    return document


@router.get("", response_model=List[DocumentWithUploader])
def list_documents(
    category: Optional[DocumentCategory] = Query(None),
    assessment_id: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List documents with filters.
    
    - Users see only their organization's documents
    - Admins see all documents
    """
    query = db.query(Document).options(
        joinedload(Document.uploaded_by)
    )
    
    # Filter by org for non-admins
    if current_user.role != UserRole.ADMIN:
        if not current_user.org_id:
            return []
        query = query.filter(Document.org_id == current_user.org_id)
    
    # Apply filters
    if category:
        query = query.filter(Document.category == category)
    
    if assessment_id:
        query = query.filter(Document.assessment_id == assessment_id)
    
    if domain:
        query = query.filter(Document.domain == domain)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Document.title.ilike(search_term)) |
            (Document.description.ilike(search_term)) |
            (Document.filename.ilike(search_term)) |
            (Document.tags.ilike(search_term))
        )
    
    # Order by upload date (newest first)
    documents = query.order_by(Document.uploaded_at.desc()).all()
    
    # Add uploader email
    result = []
    for doc in documents:
        doc_dict = {
            "id": str(doc.id),
            "org_id": str(doc.org_id),
            "title": doc.title,
            "description": doc.description,
            "category": doc.category,
            "filename": doc.filename,
            "file_size": doc.file_size,
            "mime_type": doc.mime_type,
            "assessment_id": str(doc.assessment_id) if doc.assessment_id else None,
            "domain": doc.domain,
            "uploaded_by_id": str(doc.uploaded_by_id) if doc.uploaded_by_id else None,
            "uploaded_at": doc.uploaded_at,
            "updated_at": doc.updated_at,
            "version": doc.version,
            "parent_id": str(doc.parent_id) if doc.parent_id else None,
            "tags": doc.tags,
            "uploaded_by_email": doc.uploaded_by.email if doc.uploaded_by else None,
        }
        result.append(DocumentWithUploader(**doc_dict))
    
    return result


@router.get("/{document_id}", response_model=DocumentWithUploader)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get document metadata by ID."""
    document = db.query(Document).options(
        joinedload(Document.uploaded_by)
    ).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check access
    if current_user.role != UserRole.ADMIN and document.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return DocumentWithUploader(
        id=str(document.id),
        org_id=str(document.org_id),
        title=document.title,
        description=document.description,
        category=document.category,
        filename=document.filename,
        file_size=document.file_size,
        mime_type=document.mime_type,
        assessment_id=str(document.assessment_id) if document.assessment_id else None,
        domain=document.domain,
        uploaded_by_id=str(document.uploaded_by_id) if document.uploaded_by_id else None,
        uploaded_at=document.uploaded_at,
        updated_at=document.updated_at,
        version=document.version,
        parent_id=str(document.parent_id) if document.parent_id else None,
        tags=document.tags,
        uploaded_by_email=document.uploaded_by.email if document.uploaded_by else None,
    )


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download document file."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check access
    if current_user.role != UserRole.ADMIN and document.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=file_path,
        filename=document.filename,
        media_type=document.mime_type or "application/octet-stream"
    )


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: str,
    update_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update document metadata."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check access
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot update documents"
        )
    
    if current_user.role != UserRole.ADMIN and document.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    if update_data.title is not None:
        document.title = update_data.title
    if update_data.description is not None:
        document.description = update_data.description
    if update_data.category is not None:
        document.category = update_data.category
    if update_data.assessment_id is not None:
        document.assessment_id = update_data.assessment_id
    if update_data.domain is not None:
        document.domain = update_data.domain
    if update_data.tags is not None:
        document.tags = update_data.tags
    
    document.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(document)
    
    log_audit(
        db=db,
        user_id=current_user.id,
        org_id=current_user.org_id,
        action="document_update",
        resource_type="document",
        resource_id=document.id,
        details=f"Updated document: {document.title}"
    )
    
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete document and file."""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check access
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot delete documents"
        )
    
    if current_user.role != UserRole.ADMIN and document.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete file from disk
    file_path = Path(document.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    # Delete database record
    log_audit(
        db=db,
        user_id=current_user.id,
        org_id=current_user.org_id,
        action="document_delete",
        resource_type="document",
        resource_id=document.id,
        details=f"Deleted document: {document.title}"
    )
    
    db.delete(document)
    db.commit()
    
    return None
