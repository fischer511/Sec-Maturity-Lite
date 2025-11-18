from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.assessment import AssessmentAnswer
from app.models.domain_weight import DomainWeight


def compute_domain_scores(answers: List[AssessmentAnswer]) -> Dict[str, float]:
    """
    Compute domain scores from answers.
    Each domain score is the average of all answer scores in that domain.
    Returns dict mapping domain name to score (0.0-5.0, rounded to 0.1).
    """
    domain_totals: Dict[str, List[int]] = {}
    
    for answer in answers:
        if answer.domain not in domain_totals:
            domain_totals[answer.domain] = []
        domain_totals[answer.domain].append(answer.score)
    
    domain_scores = {}
    for domain, scores in domain_totals.items():
        avg = sum(scores) / len(scores) if scores else 0.0
        domain_scores[domain] = round(avg, 1)
    
    return domain_scores


def compute_overall_score(domain_scores: Dict[str, float], db: Session = None, org_id: str = None) -> float:
    """
    Compute overall score from domain scores using domain weights.
    Overall score is the weighted average of all domain scores.
    If weights are not configured, uses equal weights (1.0) for all domains.
    Returns float (0.0-5.0, rounded to 0.1).
    """
    if not domain_scores:
        return 0.0
    
    # Get domain weights if db and org_id are provided
    weights = {}
    if db and org_id:
        weight_records = db.query(DomainWeight).filter(
            DomainWeight.org_id == org_id
        ).all()
        
        for record in weight_records:
            weights[record.domain] = record.weight
    
    # Calculate weighted sum
    weighted_sum = 0.0
    total_weight = 0.0
    
    for domain, score in domain_scores.items():
        weight = weights.get(domain, 1.0)  # Default weight is 1.0
        weighted_sum += score * weight
        total_weight += weight
    
    # Calculate weighted average
    if total_weight == 0:
        return 0.0
    
    avg = weighted_sum / total_weight
    return round(avg, 1)
