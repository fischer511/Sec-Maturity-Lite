from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class ImportLog(Base):
    """Import log for tracking CSV imports."""
    __tablename__ = "import_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    kind = Column(String, default="csv", nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, success, error
    filename = Column(String, nullable=True)
    rows_processed = Column(Integer, default=0)
    rows_created = Column(Integer, default=0)
    rows_updated = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    org = relationship("Org", back_populates="import_logs")
    assessment = relationship("Assessment")
    creator = relationship("User")
