import pytest
from app.services.recommendations import evaluate_condition, get_recommendations


def test_evaluate_condition():
    """Test condition evaluation."""
    assert evaluate_condition("score < 3", 2.5) == True
    assert evaluate_condition("score < 3", 3.0) == False
    assert evaluate_condition("score < 3", 3.5) == False
    
    assert evaluate_condition("score <= 3", 3.0) == True
    assert evaluate_condition("score <= 3", 3.5) == False
    
    assert evaluate_condition("score == 3", 3.0) == True
    assert evaluate_condition("score == 3", 2.9) == False
    
    assert evaluate_condition("score >= 3", 3.0) == True
    assert evaluate_condition("score >= 3", 2.9) == False
    
    assert evaluate_condition("score > 3", 3.5) == True
    assert evaluate_condition("score > 3", 3.0) == False


def test_evaluate_condition_invalid():
    """Test invalid conditions."""
    assert evaluate_condition("invalid", 3.0) == False
    assert evaluate_condition("score < abc", 3.0) == False
    assert evaluate_condition("x < 3", 3.0) == False


def test_get_recommendations():
    """Test recommendation generation."""
    domain_scores = {
        "governance": 2.5,
        "access": 3.5,
    }
    
    recommendations = get_recommendations(domain_scores)
    
    # Should have recommendations for governance (score < 3)
    gov_recs = [r for r in recommendations if r["domain"] == "governance"]
    assert len(gov_recs) > 0
    
    # Should have fewer recommendations for access (score >= 3)
    access_recs = [r for r in recommendations if r["domain"] == "access"]
    # Access has score 3.5, so no recommendations with "< 3" threshold
    assert all(r["id"] not in ["ACC-01"] for r in access_recs)
