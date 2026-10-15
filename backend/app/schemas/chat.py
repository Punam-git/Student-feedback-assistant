from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatQueryRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000)
    session_id: Optional[str] = None
    subject_id: Optional[int] = None  # Optional subject focus filter


class SourceCitation(BaseModel):
    source_title: str
    category: str
    content_snippet: str
    relevance_score: Optional[float] = None
    page: Optional[int] = None


class ChatQueryResponse(BaseModel):
    session_id: str
    query: str
    query_type: str  # "statistics", "knowledge", "general"
    response: str
    sources: List[SourceCitation] = []
    is_fallback: bool = False
    provider_used: str  # "gemini", "local-rag", "sql-analytics", "fallback"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRatingRequest(BaseModel):
    message_id: int
    is_helpful: bool
