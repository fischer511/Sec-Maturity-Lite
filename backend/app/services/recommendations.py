import yaml
import re
from pathlib import Path
from typing import List, Dict, Any


def load_rules() -> Dict[str, List[Dict[str, Any]]]:
    """Load recommendation rules from YAML file."""
    rules_path = Path(__file__).parent.parent / "rules" / "recommendations.yaml"
    
    if not rules_path.exists():
        return {}
    
    with open(rules_path, "r", encoding="utf-8") as f:
        rules = yaml.safe_load(f)
    
    return rules or {}


def evaluate_condition(condition: str, score: float) -> bool:
    """
    Safely evaluate a simple condition like "score < 3".
    Only supports: score <|<=|==|>=|> NUMBER
    """
    # Match pattern: score OPERATOR NUMBER
    pattern = r"^score\s*(<|<=|==|>=|>)\s*(\d+(?:\.\d+)?)$"
    match = re.match(pattern, condition.strip())
    
    if not match:
        return False
    
    operator, threshold = match.groups()
    threshold = float(threshold)
    
    if operator == "<":
        return score < threshold
    elif operator == "<=":
        return score <= threshold
    elif operator == "==":
        return score == threshold
    elif operator == ">=":
        return score >= threshold
    elif operator == ">":
        return score > threshold
    
    return False


def get_recommendations(domain_scores: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Get recommendations based on domain scores and rules.
    Returns list of recommendations (id, title, details, domain).
    """
    rules = load_rules()
    recommendations = []
    
    for domain, score in domain_scores.items():
        domain_rules = rules.get(domain, [])
        
        for rule in domain_rules:
            condition = rule.get("if", "")
            then_block = rule.get("then", {})
            
            if evaluate_condition(condition, score):
                recommendations.append({
                    "id": then_block.get("id", ""),
                    "title": then_block.get("title", ""),
                    "details": then_block.get("details", ""),
                    "domain": domain,
                })
    
    return recommendations
