import pytest
from app.services.scoring import compute_domain_scores, compute_overall_score
from app.models.assessment import AssessmentAnswer
from unittest.mock import Mock
import uuid


def test_compute_domain_scores():
    """Test domain score computation."""
    # Create mock answers
    assessment_id = uuid.uuid4()
    answers = [
        Mock(assessment_id=assessment_id, domain="governance", score=3),
        Mock(assessment_id=assessment_id, domain="governance", score=4),
        Mock(assessment_id=assessment_id, domain="access", score=2),
        Mock(assessment_id=assessment_id, domain="access", score=3),
        Mock(assessment_id=assessment_id, domain="access", score=4),
    ]
    
    scores = compute_domain_scores(answers)
    
    assert scores["governance"] == 3.5
    assert scores["access"] == 3.0


def test_compute_overall_score():
    """Test overall score computation."""
    domain_scores = {
        "governance": 3.5,
        "access": 3.0,
        "asset": 4.0,
    }
    
    overall = compute_overall_score(domain_scores)
    
    assert overall == 3.5


def test_compute_overall_score_empty():
    """Test overall score with no domains."""
    overall = compute_overall_score({})
    assert overall == 0.0
