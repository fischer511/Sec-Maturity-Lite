from fastapi import APIRouter, Body
from typing import List, Dict, Optional
from app.services.questions import (
    get_all_questions,
    get_questions_by_domain,
    get_all_domains,
    get_domain_name,
    Question,
)
from pydantic import BaseModel


class QuestionResponse(BaseModel):
    code: str
    domain: str
    text: str
    parent_question_code: Optional[str] = None
    condition_type: Optional[str] = None
    condition_value: Optional[int] = None


class DomainResponse(BaseModel):
    code: str
    name: str
    question_count: int


class FilteredQuestionsRequest(BaseModel):
    domain: str
    answers: Dict[str, int]  # question_code -> score


router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=List[QuestionResponse])
def list_all_questions():
    """Get all assessment questions (including branching metadata)."""
    questions = get_all_questions()
    return [
        QuestionResponse(
            code=q.code, 
            domain=q.domain, 
            text=q.text,
            parent_question_code=q.parent_question_code,
            condition_type=q.condition_type,
            condition_value=q.condition_value
        ) for q in questions
    ]


@router.get("/domains", response_model=List[DomainResponse])
def list_domains():
    """Get all domains with base question counts (excluding branching)."""
    domains = get_all_domains()
    result = []
    for domain in domains:
        # Count only base questions (no parent) for initial domain display
        base_questions = get_questions_by_domain(domain, answers=None)
        result.append(
            DomainResponse(
                code=domain,
                name=get_domain_name(domain),
                question_count=len(base_questions),
            )
        )
    return result


@router.get("/{domain}", response_model=List[QuestionResponse])
def list_questions_by_domain(domain: str):
    """Get base questions for a specific domain (no branching logic applied)."""
    questions = get_questions_by_domain(domain, answers=None)
    return [
        QuestionResponse(
            code=q.code, 
            domain=q.domain, 
            text=q.text,
            parent_question_code=q.parent_question_code,
            condition_type=q.condition_type,
            condition_value=q.condition_value
        ) for q in questions
    ]


@router.post("/filtered", response_model=List[QuestionResponse])
def get_filtered_questions(request: FilteredQuestionsRequest):
    """
    Get questions for a domain with branching logic applied.
    Provide current answers to dynamically show/hide follow-up questions.
    """
    questions = get_questions_by_domain(request.domain, answers=request.answers)
    return [
        QuestionResponse(
            code=q.code,
            domain=q.domain,
            text=q.text,
            parent_question_code=q.parent_question_code,
            condition_type=q.condition_type,
            condition_value=q.condition_value
        ) for q in questions
    ]
