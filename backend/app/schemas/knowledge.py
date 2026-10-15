from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FAQCreate(BaseModel):
    faq_id: str
    category: str
    question: str
    answer: str
    is_active: bool = True


class FAQUpdate(BaseModel):
    category: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    is_active: Optional[bool] = None


class FAQOut(BaseModel):
    id: int
    faq_id: str
    category: str
    question: str
    answer: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    title: str
    filename: str
    file_type: str
    category: str
    chunk_count: int
    is_indexed: bool
    ingestion_status: str
    error_message: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class RetrievalChunk(BaseModel):
    document_title: str
    category: str
    chunk_text: str
    similarity_score: float
    page_number: Optional[int] = None


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: List[RetrievalChunk]
    total_found: int
