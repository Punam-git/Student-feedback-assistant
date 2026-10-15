from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class SubjectOut(BaseModel):
    id: int
    code: str
    name: str
    department: str
    semester: int
    faculty_name: str

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    code: str
    name: str
    department: str = "Computer Science & Engineering"
    semester: int = 5
    faculty_name: str


class FeedbackCreate(BaseModel):
    subject_id: int
    overall_rating: int = Field(..., ge=1, le=5, description="Overall satisfaction rating from 1 to 5")
    teaching_clarity: int = Field(..., ge=1, le=5, description="Clarity of concepts from 1 to 5")
    course_content: int = Field(..., ge=1, le=5, description="Quality and relevance of syllabus from 1 to 5")
    practical_sessions: int = Field(..., ge=1, le=5, description="Lab hands-on sessions from 1 to 5")
    written_feedback: str = Field(..., min_length=10, max_length=2000, description="Constructive qualitative comments")
    suggestions: Optional[str] = Field(None, max_length=1000, description="Optional actionable suggestions")
    is_anonymous: bool = False


class SentimentOut(BaseModel):
    id: int
    predicted_sentiment: str
    confidence: float
    model_name: str
    themes: Optional[str] = None
    analyzed_at: datetime

    class Config:
        from_attributes = True


class FeedbackOut(BaseModel):
    id: int
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    overall_rating: int
    teaching_clarity: int
    course_content: int
    practical_sessions: int
    written_feedback: str
    suggestions: Optional[str] = None
    is_anonymous: bool
    is_demo: bool
    created_at: datetime
    sentiment: Optional[SentimentOut] = None

    class Config:
        from_attributes = True
