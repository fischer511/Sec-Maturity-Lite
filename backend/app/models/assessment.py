import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("orgs.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    assessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    overall_score = Column(Float, nullable=True)
    
    # Relationships
    org = relationship("Org", back_populates="assessments")
    team = relationship("Team", back_populates="assessments")
    creator = relationship("User", back_populates="assessments_created")
    domains = relationship("AssessmentDomain", back_populates="assessment", cascade="all, delete-orphan")
    answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")
    tasks = relationship("RemediationTask", back_populates="assessment", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="assessment")


class AssessmentDomain(Base):
    __tablename__ = "assessment_domains"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    domain = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="domains")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    domain = Column(String, nullable=False)
    question_code = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="answers")
