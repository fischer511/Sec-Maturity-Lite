from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
import csv
import io
from app.core.deps import get_db, get_current_user
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentDetailResponse,
    AssessmentAnswersBulk,
)
from app.schemas.recommendation import RecommendationsResponse, RecommendationItem
from app.schemas.task import TaskResponse
from app.models.assessment import Assessment, AssessmentDomain, AssessmentAnswer
from app.models.org import Org
from app.models.user import User
from app.models.remediation_task import RemediationTask, TaskStatus, TaskPriority
from app.services.scoring import compute_domain_scores, compute_overall_score
from app.services.recommendations import get_recommendations
from app.services.pdf import generate_assessment_pdf
from app.utils.audit import log_audit

router = APIRouter(prefix="/assessments", tags=["assessments"])
orgs_router = APIRouter(prefix="/orgs", tags=["assessments"])


@orgs_router.post("/{org_id}/assessments", response_model=AssessmentResponse)
def create_assessment(
    org_id: UUID,
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new assessment for an organization."""
    org = db.query(Org).filter(Org.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    assessment = Assessment(
        org_id=org_id,
        created_by=current_user.id,
        version=assessment_data.version,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Audit log
    log_audit(
        db,
        action="assessment.created",
        actor_user=current_user,
        org_id=org_id,
        meta={"assessment_id": str(assessment.id), "version": assessment.version},
    )
    db.commit()
    
    return assessment


@orgs_router.get("/{org_id}/assessments", response_model=List[AssessmentDetailResponse])
def list_assessments(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List assessments for an organization."""
    # Check access
    if current_user.role != "admin" and current_user.org_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    assessments = db.query(Assessment).filter(Assessment.org_id == org_id).order_by(Assessment.assessed_at.desc()).all()
    return assessments


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
def get_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get assessment details with domains and answers."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return assessment


@router.post("/{assessment_id}/answers")
def bulk_upsert_answers(
    assessment_id: UUID,
    answers_data: AssessmentAnswersBulk,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk upsert answers for an assessment."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Delete existing answers and insert new ones
    db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).delete()
    
    for answer_data in answers_data.answers:
        answer = AssessmentAnswer(
            assessment_id=assessment_id,
            domain=answer_data.domain,
            question_code=answer_data.question_code,
            score=answer_data.score,
            note=answer_data.note,
        )
        db.add(answer)
    
    db.commit()
    
    return {"message": "Answers saved successfully"}


@router.post("/{assessment_id}/finalize", response_model=AssessmentDetailResponse)
def finalize_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Finalize assessment: compute scores and save domain results."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.assessment_id == assessment_id).all()
    
    if not answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No answers found for this assessment",
        )
    
    # Compute scores (with domain weights)
    domain_scores = compute_domain_scores(answers)
    overall_score = compute_overall_score(domain_scores, db=db, org_id=assessment.org_id)
    
    # Delete existing domain scores
    db.query(AssessmentDomain).filter(AssessmentDomain.assessment_id == assessment_id).delete()
    
    # Save domain scores
    for domain, score in domain_scores.items():
        domain_entry = AssessmentDomain(
            assessment_id=assessment_id,
            domain=domain,
            score=score,
        )
        db.add(domain_entry)
    
    # Update assessment
    assessment.overall_score = overall_score
    assessment.assessed_at = datetime.utcnow()
    
    # Audit log
    log_audit(
        db,
        action="assessment.finalized",
        actor_user=current_user,
        org_id=assessment.org_id,
        meta={"assessment_id": str(assessment.id), "overall_score": overall_score},
    )
    
    db.commit()
    db.refresh(assessment)
    
    return assessment


@router.get("/{assessment_id}/recommendations", response_model=RecommendationsResponse)
def get_assessment_recommendations(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recommendations for an assessment based on domain scores."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    domains = db.query(AssessmentDomain).filter(AssessmentDomain.assessment_id == assessment_id).all()
    
    if not domains:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment not finalized yet",
        )
    
    domain_scores = {d.domain: d.score for d in domains}
    recommendations = get_recommendations(domain_scores)
    
    return RecommendationsResponse(
        recommendations=[RecommendationItem(**rec) for rec in recommendations]
    )


@router.get("/{assessment_id}/pdf")
def export_assessment_pdf(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export assessment as PDF."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    if assessment.overall_score is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment not finalized yet",
        )
    
    domains = db.query(AssessmentDomain).filter(AssessmentDomain.assessment_id == assessment_id).all()
    domain_list = [{"name": d.domain, "score": d.score} for d in domains]
    
    domain_scores = {d.domain: d.score for d in domains}
    recommendations = get_recommendations(domain_scores)
    
    pdf_content = generate_assessment_pdf(
        org_name=assessment.org.name,
        assessed_date=assessment.assessed_at,
        version=assessment.version,
        overall_score=assessment.overall_score,
        domains=domain_list,
        recommendations=recommendations,
    )
    
    # Audit log
    log_audit(
        db,
        action="assessment.pdf_exported",
        actor_user=current_user,
        org_id=assessment.org_id,
        meta={"assessment_id": str(assessment_id)},
    )
    db.commit()
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=assessment_{assessment_id}.pdf"},
    )


@router.get("/{assessment_id}/export.csv")
def export_assessment_csv(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export assessment answers and scores as CSV."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    
    # Check access
    if current_user.role != "admin" and current_user.org_id != assessment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Get all answers and domain scores
    answers = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.assessment_id == assessment_id
    ).order_by(AssessmentAnswer.domain, AssessmentAnswer.question_code).all()
    
    domains = db.query(AssessmentDomain).filter(
        AssessmentDomain.assessment_id == assessment_id
    ).all()
    
    domain_scores_map = {d.domain: d.score for d in domains}
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["domain", "question_code", "answer_score", "note", "domain_score"])
    
    # Write data rows
    for answer in answers:
        domain_score = domain_scores_map.get(answer.domain, "")
        writer.writerow([
            answer.domain,
            answer.question_code,
            answer.score,
            answer.note or "",
            domain_score
        ])
    
    # Audit log
    log_audit(
        db,
        action="assessment.csv_exported",
        actor_user=current_user,
        org_id=assessment.org_id,
        meta={"assessment_id": str(assessment_id)},
    )
    db.commit()
    
    # Return CSV as streaming response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=assessment_{assessment_id}.csv"},
    )


@router.post("/{assessment_id}/create-task-from-recommendation", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task_from_recommendation(
    assessment_id: UUID,
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Quick-create a task from a recommendation.
    
    - Takes recommendation ID (e.g., "GOV-01")
    - Creates a task with recommendation details pre-filled
    - Status: todo, Priority: based on recommendation priority
    """
    # Verify assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check access
    if current_user.org_id != assessment.org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get recommendations for this assessment
    domain_scores = {d.domain: d.score for d in assessment.domains}
    recommendations = get_recommendations(domain_scores)
    
    # Find the specific recommendation
    rec_item = next((r for r in recommendations if r.get("id") == recommendation_id), None)
    if not rec_item:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    # Map recommendation priority to task priority
    priority_map = {
        "high": TaskPriority.high,
        "medium": TaskPriority.medium,
        "low": TaskPriority.low,
    }
    
    task_priority = priority_map.get(rec_item.get("priority", "medium"), TaskPriority.medium)
    
    # Create task
    new_task = RemediationTask(
        assessment_id=assessment_id,
        org_id=assessment.org_id,
        recommendation_id=recommendation_id,
        domain=rec_item.get("domain"),
        title=rec_item.get("title", ""),
        description=rec_item.get("details", ""),
        created_by_id=current_user.id,
        status=TaskStatus.todo,
        priority=task_priority,
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Audit log
    log_audit(
        db=db,
        action="task.created_from_recommendation",
        actor_user=current_user,
        org_id=assessment.org_id,
        meta={
            "task_id": str(new_task.id),
            "assessment_id": str(assessment_id),
            "recommendation_id": recommendation_id,
        },
    )
    
    return new_task
