from pydantic import BaseModel
from typing import List


class RecommendationItem(BaseModel):
    id: str
    title: str
    details: str
    domain: str


class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationItem]
