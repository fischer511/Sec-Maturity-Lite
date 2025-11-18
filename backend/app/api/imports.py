from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import csv
import io
from app.core.deps import get_db, get_current_user
from app.schemas.import_log import CSVImportResult, ImportLogResponse
from app.models.import_log import ImportLog
from app.models.assessment import Assessment, AssessmentAnswer
from app.models.user import User
from app.utils.audit import log_audit

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("/csv/{assessment_id}", response_model=CSVImportResult)
async def import_assessment_csv(
    assessment_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Import assessment answers from CSV file.
    Expected CSV format: domain, question_code, answer_score, note, domain_score
    """
    # Check assessment exists and user has access
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
    
    # Create import log
    import_log = ImportLog(
        org_id=assessment.org_id,
        assessment_id=assessment_id,
        created_by=current_user.id,
        kind="csv",
        status="pending",
        filename=file.filename,
    )
    db.add(import_log)
    db.commit()
    db.refresh(import_log)
    
    try:
        # Read and parse CSV
        contents = await file.read()
        csv_text = contents.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        rows_processed = 0
        rows_created = 0
        rows_updated = 0
        
        # Validate headers
        expected_headers = {"domain", "question_code", "answer_score", "note"}
        actual_headers = set(csv_reader.fieldnames or [])
        
        if not expected_headers.issubset(actual_headers):
            missing = expected_headers - actual_headers
            raise ValueError(f"Missing required columns: {', '.join(missing)}")
        
        # Track existing answers to determine create vs update
        existing_answers = {}
        for ans in db.query(AssessmentAnswer).filter(
            AssessmentAnswer.assessment_id == assessment_id
        ).all():
            key = f"{ans.domain}:{ans.question_code}"
            existing_answers[key] = ans
        
        # Process each row
        for row in csv_reader:
            rows_processed += 1
            
            domain = row.get("domain", "").strip()
            question_code = row.get("question_code", "").strip()
            answer_score = row.get("answer_score", "").strip()
            note = row.get("note", "").strip()
            
            # Validate required fields
            if not domain or not question_code:
                continue
            
            # Parse score
            try:
                score = int(answer_score) if answer_score else 0
            except ValueError:
                continue
            
            # Check if answer exists
            key = f"{domain}:{question_code}"
            
            if key in existing_answers:
                # Update existing
                existing_answer = existing_answers[key]
                existing_answer.score = score
                existing_answer.note = note or None
                rows_updated += 1
            else:
                # Create new
                new_answer = AssessmentAnswer(
                    assessment_id=assessment_id,
                    domain=domain,
                    question_code=question_code,
                    score=score,
                    note=note or None,
                )
                db.add(new_answer)
                rows_created += 1
        
        # Update import log
        import_log.status = "success"
        import_log.rows_processed = rows_processed
        import_log.rows_created = rows_created
        import_log.rows_updated = rows_updated
        
        # Audit log
        log_audit(
            db,
            action="assessment.csv_imported",
            actor_user=current_user,
            org_id=assessment.org_id,
            meta={
                "assessment_id": str(assessment_id),
                "import_id": str(import_log.id),
                "rows_processed": rows_processed,
                "rows_created": rows_created,
                "rows_updated": rows_updated,
            },
        )
        
        db.commit()
        
        return CSVImportResult(
            import_id=import_log.id,
            status="success",
            rows_processed=rows_processed,
            rows_created=rows_created,
            rows_updated=rows_updated,
        )
        
    except Exception as e:
        # Update import log with error
        import_log.status = "error"
        import_log.error_message = str(e)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV import failed: {str(e)}",
        )


@router.get("/{org_id}/history", response_model=List[ImportLogResponse])
def list_import_history(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List import history for an organization."""
    # Check access
    if current_user.role != "admin" and current_user.org_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    imports = db.query(ImportLog).filter(
        ImportLog.org_id == org_id
    ).order_by(ImportLog.created_at.desc()).limit(50).all()
    
    return imports
