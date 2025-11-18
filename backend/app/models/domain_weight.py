import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class DomainWeight(Base):
    """Domain weights for weighted scoring calculations"""
    __tablename__ = "domain_weights"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=False)
    domain = Column(String, nullable=False)
    weight = Column(Float, nullable=False, default=1.0)  # Default weight is 1.0 (equal weighting)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    org = relationship("Org", back_populates="domain_weights")
    
    def __repr__(self):
        return f"<DomainWeight(domain={self.domain}, weight={self.weight})>"
