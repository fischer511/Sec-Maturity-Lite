"""
Questions service - manages assessment questions organized by domain.
Each question has a code, domain, and text in Slovenian.
Scoring: Likert scale 0-5 (0=Not implemented, 5=Optimizing)

Multi-level branching support:
- parent_question_code: Code of parent question (if this is a follow-up)
- condition_type: Type of condition ('score_gte', 'score_lte', 'score_eq', 'always')
- condition_value: Value to compare against (for score conditions)
"""
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class Question:
    code: str
    domain: str
    text: str
    parent_question_code: Optional[str] = None  # Parent question code for branching
    condition_type: Optional[str] = None  # 'score_gte', 'score_lte', 'score_eq', 'always'
    condition_value: Optional[int] = None  # Condition value (score threshold)


# 6 domains, ~4-5 questions each + branching questions (total 35+ questions)
QUESTIONS_DATA = [
    # GOVERNANCE (5 base + 2 branching = 7 questions)
    Question("GOV-Q1", "governance", "Ali ima vaša organizacija dokumentirano politiko varovanja informacij?"),
    Question("GOV-Q1-A", "governance", "Ali je politika varovanja informacij redno posodabljana (vsaj letno)?", 
             parent_question_code="GOV-Q1", condition_type="score_gte", condition_value=3),
    
    Question("GOV-Q2", "governance", "Ali je imenovan odgovorni za informacijsko varnost (CISO ali ekvivalent)?"),
    Question("GOV-Q2-A", "governance", "Ali CISO poroča neposredno izvršnemu vodstvu ali upravnemu odboru?",
             parent_question_code="GOV-Q2", condition_type="score_gte", condition_value=3),
    
    Question("GOV-Q3", "governance", "Ali izvajate redno letno oceno tveganj kibernetske varnosti?"),
    Question("GOV-Q4", "governance", "Ali imate vzpostavljen register informacijskih sredstev?"),
    Question("GOV-Q5", "governance", "Ali vodstvo redno prejema poročila o stanju kibernetske varnosti?"),
    
    # ASSET MANAGEMENT (5 base + 2 branching = 7 questions)
    Question("ASS-Q1", "asset", "Ali imate celovit seznam vseh informacijskih sredstev (strojna in programska oprema)?"),
    Question("ASS-Q1-A", "asset", "Ali je inventar sredstev avtomatiziran in povezan s sistemom odkrivanja sredstev?",
             parent_question_code="ASS-Q1", condition_type="score_gte", condition_value=4),
    
    Question("ASS-Q2", "asset", "Ali so vsa sredstva klasificirana glede na kritičnost in vrednost?"),
    Question("ASS-Q3", "asset", "Ali imate vzpostavljen postopek za obvladovanje življenjskega cikla sredstev?"),
    Question("ASS-Q4", "asset", "Ali redno preverjate in posodabljate inventar sredstev (najmanj letno)?"),
    Question("ASS-Q5", "asset", "Ali so podatki klasificirani (javno, interno, zaupno, strogo zaupno)?"),
    Question("ASS-Q5-A", "asset", "Ali uporabljate avtomatizirane oznake/labele za klasifikacijo podatkov (DLP, AIP)?",
             parent_question_code="ASS-Q5", condition_type="score_gte", condition_value=3),
    
    # ACCESS CONTROL (5 base + 3 branching = 8 questions)
    Question("ACC-Q1", "access", "Ali uporabljate večfaktorsko avtentikacijo (MFA) za kritične sisteme?"),
    Question("ACC-Q1-A", "access", "Ali je MFA obvezna za vse uporabnike (tudi za standardne uporabnike)?",
             parent_question_code="ACC-Q1", condition_type="score_gte", condition_value=3),
    
    Question("ACC-Q2", "access", "Ali imate formalen postopek za upravljanje dostopnih pravic (dodelitev, odvzem)?"),
    Question("ACC-Q3", "access", "Ali izvajate redne preglede dostopnih pravic (access reviews) najmanj letno?"),
    Question("ACC-Q3-A", "access", "Ali so pregledi dostopnih pravic avtomatizirani z uporabo IGA rešitev?",
             parent_question_code="ACC-Q3", condition_type="score_gte", condition_value=4),
    
    Question("ACC-Q4", "access", "Ali uporabljate principe najmanjših potrebnih privilegijev (least privilege)?"),
    Question("ACC-Q5", "access", "Ali imajo privilegirani računi (admin) posebne varnostne zahteve (MFA, monitoring)?"),
    Question("ACC-Q5-A", "access", "Ali uporabljate Privileged Access Management (PAM) rešitev za admin račune?",
             parent_question_code="ACC-Q5", condition_type="score_gte", condition_value=3),
    
    # OPERATIONS & MONITORING (4 base + 2 branching = 6 questions)
    Question("OPS-Q1", "operations", "Ali imate centralizirano beleženje varnostnih dogodkov (centralni log)?"),
    Question("OPS-Q1-A", "operations", "Ali uporabljate SIEM (Security Information and Event Management) rešitev?",
             parent_question_code="OPS-Q1", condition_type="score_gte", condition_value=3),
    
    Question("OPS-Q2", "operations", "Ali shranjujete dnevniške zapise vsaj 12 mesecev?"),
    Question("OPS-Q3", "operations", "Ali imate vzpostavljen proces za upravljanje varnostnih popravkov (patch management)?"),
    Question("OPS-Q3-A", "operations", "Ali je patch management avtomatiziran z uporabo centraliziranih orodij?",
             parent_question_code="OPS-Q3", condition_type="score_gte", condition_value=3),
    
    Question("OPS-Q4", "operations", "Ali redno spremljate in analizirate varnostne dogodke (SIEM ali podobno)?"),
    
    # INCIDENT RESPONSE (4 base + 1 branching = 5 questions)
    Question("INC-Q1", "incident", "Ali imate dokumentiran načrt odziva na incidente (incident response plan)?"),
    Question("INC-Q1-A", "incident", "Ali načrt odziva vključuje scenarije ransomware napadov in data breach incidentov?",
             parent_question_code="INC-Q1", condition_type="score_gte", condition_value=3),
    
    Question("INC-Q2", "incident", "Ali je določena ekipa za odziv na incidente z jasnimi vlogami in odgovornostmi?"),
    Question("INC-Q3", "incident", "Ali izvajate redne vaje odziva na incidente (tabletop ali simulacije)?"),
    Question("INC-Q4", "incident", "Ali imate vzpostavljen postopek za prijavo in eskalacijo varnostnih incidentov?"),
    
    # BUSINESS CONTINUITY (4 base + 1 branching = 5 questions)
    Question("BCP-Q1", "continuity", "Ali redno izdelujete varnostne kopije kritičnih podatkov (backup)?"),
    Question("BCP-Q1-A", "continuity", "Ali so varnostne kopije shranjene offsite ali v oblaku (geografsko ločeno)?",
             parent_question_code="BCP-Q1", condition_type="score_gte", condition_value=3),
    
    Question("BCP-Q2", "continuity", "Ali testirate obnovitev podatkov iz varnostnih kopij (restore test)?"),
    Question("BCP-Q3", "continuity", "Ali imate dokumentiran načrt neprekinjenega poslovanja (BCP/DRP)?"),
    Question("BCP-Q4", "continuity", "Ali izvajate letne vaje načrta neprekinjenega poslovanja?"),
]


def get_all_questions() -> List[Question]:
    """Get all assessment questions."""
    return QUESTIONS_DATA


def get_questions_by_domain(domain: str, answers: Optional[Dict[str, int]] = None) -> List[Question]:
    """
    Get questions filtered by domain with branching logic support.
    
    Args:
        domain: Domain code to filter by
        answers: Dict mapping question_code -> score (used for branching logic)
    
    Returns:
        List of questions that should be displayed based on current answers
    """
    domain_questions = [q for q in QUESTIONS_DATA if q.domain == domain]
    
    # If no answers provided, return only base questions (no parent)
    if answers is None or len(answers) == 0:
        return [q for q in domain_questions if q.parent_question_code is None]
    
    # Filter questions based on branching conditions
    visible_questions = []
    for q in domain_questions:
        # Base questions (no parent) are always visible
        if q.parent_question_code is None:
            visible_questions.append(q)
            continue
        
        # Check if parent question is answered
        parent_score = answers.get(q.parent_question_code)
        if parent_score is None:
            continue  # Parent not answered yet, don't show child
        
        # Evaluate condition
        condition_met = False
        if q.condition_type == "score_gte" and q.condition_value is not None:
            condition_met = parent_score >= q.condition_value
        elif q.condition_type == "score_lte" and q.condition_value is not None:
            condition_met = parent_score <= q.condition_value
        elif q.condition_type == "score_eq" and q.condition_value is not None:
            condition_met = parent_score == q.condition_value
        elif q.condition_type == "always":
            condition_met = True
        
        if condition_met:
            visible_questions.append(q)
    
    return visible_questions


def get_all_domains() -> List[str]:
    """Get list of all unique domains."""
    domains = []
    seen = set()
    for q in QUESTIONS_DATA:
        if q.domain not in seen:
            domains.append(q.domain)
            seen.add(q.domain)
    return domains


def get_question_by_code(code: str) -> Question | None:
    """Get a specific question by code."""
    for q in QUESTIONS_DATA:
        if q.code == code:
            return q
    return None


# Domain display names (Slovenian)
DOMAIN_NAMES = {
    "governance": "Upravljanje in vodenje",
    "asset": "Upravljanje sredstev",
    "access": "Nadzor dostopa",
    "operations": "Operacije in spremljanje",
    "incident": "Odziv na incidente",
    "continuity": "Neprekinjeno poslovanje",
}


def get_domain_name(domain: str) -> str:
    """Get display name for domain."""
    return DOMAIN_NAMES.get(domain, domain)
