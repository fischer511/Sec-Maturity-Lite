"""
Document model for evidence library.
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base


class DocumentCategory(str, enum.Enum):
    """Document categories."""
    policy = "policy"  # Politike
    procedure = "procedure"  # Postopki
    certificate = "certificate"  # Certifikati
    contract = "contract"  # Pogodbe
    audit_report = "audit_report"  # Revizijska poročila
    risk_assessment = "risk_assessment"  # Ocene tveganj
    network_diagram = "network_diagram"  # Omrežne sheme
    log = "log"  # Dnevniki
    other = "other"  # Ostalo


class Document(Base):
    """Document model for storing uploaded files."""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False)
    
    # Document info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(DocumentCategory), nullable=False)
    
    # File info
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # Path on disk
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    
    # Optional linking
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    domain = Column(String(50), nullable=True)  # Link to specific domain
    
    # Metadata
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Version control
    version = Column(Integer, default=1, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    # Tags for search
    tags = Column(Text, nullable=True)  # Comma-separated tags
    
    # Relationships
    org = relationship("Org", back_populates="documents")
    assessment = relationship("Assessment", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    parent = relationship("Document", remote_side=[id], backref="versions")
