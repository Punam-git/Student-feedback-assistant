from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class SentimentDistribution(BaseModel):
    positive: int = 0
    neutral: int = 0
    negative: int = 0
    mixed: int = 0
    total: int = 0
    positive_percentage: float = 0.0
    neutral_percentage: float = 0.0
    negative_percentage: float = 0.0
    mixed_percentage: float = 0.0


class RatingDistribution(BaseModel):
    stars_1: int = 0
    stars_2: int = 0
    stars_3: int = 0
    stars_4: int = 0
    stars_5: int = 0
    total: int = 0


class SubjectRatingStat(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    feedback_count: int
    avg_overall: float
    avg_teaching_clarity: float
    avg_course_content: float
    avg_practical_sessions: float
    positive_ratio: float


class ThemeCount(BaseModel):
    theme: str
    count: int
    sentiment: str  # "improvement" or "positive"


class TrendPoint(BaseModel):
    date: str
    avg_rating: float
    count: int
    positive_count: int
    negative_count: int


class AnalyticsOverview(BaseModel):
    total_feedback: int
    avg_overall_rating: float
    avg_teaching_clarity: float
    avg_course_content: float
    avg_practical_sessions: float
    sentiment_distribution: SentimentDistribution
    rating_distribution: RatingDistribution
    subject_stats: List[SubjectRatingStat]
    top_improvement_themes: List[ThemeCount]
    top_positive_highlights: List[ThemeCount]
    trends: List[TrendPoint]
    is_demo_active: bool
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    ai_grounded_summary: Optional[str] = None
