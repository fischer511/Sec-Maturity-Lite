"""
Schemas for document management.
"""
from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from app.models.document import DocumentCategory


class DocumentCreate(BaseModel):
    """Schema for creating a new document."""
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    assessment_id: Optional[UUID4] = None
    domain: Optional[str] = None
    tags: Optional[str] = None


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata."""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[DocumentCategory] = None
    assessment_id: Optional[UUID4] = None
    domain: Optional[str] = None
    tags: Optional[str] = None


class DocumentResponse(BaseModel):
    """Schema for document response."""
    id: UUID4
    org_id: UUID4
    title: str
    description: Optional[str]
    category: DocumentCategory
    filename: str
    file_size: int
    mime_type: Optional[str]
    assessment_id: Optional[UUID4]
    domain: Optional[str]
    uploaded_by_id: Optional[UUID4]
    uploaded_at: datetime
    updated_at: datetime
    version: int
    parent_id: Optional[UUID4]
    tags: Optional[str]
    
    class Config:
        from_attributes = True


class DocumentWithUploader(DocumentResponse):
    """Document response with uploader email."""
    uploaded_by_email: Optional[str] = None
