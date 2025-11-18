from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, List


class AssessmentAnswerBase(BaseModel):
    domain: str
    question_code: str
    score: int  # 0-5
    note: Optional[str] = None


class AssessmentAnswerCreate(AssessmentAnswerBase):
    pass


class AssessmentAnswerResponse(AssessmentAnswerBase):
    id: UUID4
    assessment_id: UUID4
    
    class Config:
        from_attributes = True


class AssessmentDomainResponse(BaseModel):
    id: UUID4
    assessment_id: UUID4
    domain: str
    score: float
    
    class Config:
        from_attributes = True


class AssessmentBase(BaseModel):
    version: int = 1


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentResponse(AssessmentBase):
    id: UUID4
    org_id: UUID4
    created_by: UUID4
    assessed_at: datetime
    overall_score: Optional[float]
    
    class Config:
        from_attributes = True


class AssessmentDetailResponse(AssessmentResponse):
    domains: List[AssessmentDomainResponse] = []
    answers: List[AssessmentAnswerResponse] = []
    
    class Config:
        from_attributes = True


class AssessmentAnswersBulk(BaseModel):
    answers: List[AssessmentAnswerCreate]
