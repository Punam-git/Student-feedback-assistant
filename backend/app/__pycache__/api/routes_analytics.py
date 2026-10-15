import io
import csv
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.feedback import Feedback, SentimentResult
from app.models.subject import Subject
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics import analytics_service
from app.api.deps import require_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment (Positive, Neutral, Negative, Mixed)"),
    min_rating: Optional[int] = Query(None, ge=1, le=5, description="Minimum overall rating"),
    max_rating: Optional[int] = Query(None, ge=1, le=5, description="Maximum overall rating"),
    date_from: Optional[datetime] = Query(None, description="Start date filter"),
    date_to: Optional[datetime] = Query(None, description="End date filter"),
    include_demo: bool = Query(True, description="Whether to include demonstration feedback records"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve comprehensive aggregated analytics and visual metrics (Admin only).
    Calculates actual database counts, rating averages, sentiment breakdowns, and trends.
    """
    return analytics_service.get_overview(
        db=db,
        subject_id=subject_id,
        sentiment=sentiment,
        min_rating=min_rating,
        max_rating=max_rating,
        date_from=date_from,
        date_to=date_to,
        include_demo=include_demo
    )


@router.get("/export-csv")
def export_feedback_csv(
    subject_id: Optional[int] = Query(None),
    sentiment: Optional[str] = Query(None),
    include_demo: bool = Query(True),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Export feedback dataset as a downloadable CSV spreadsheet with full metadata (Admin only).
    """
    query = db.query(Feedback).join(Subject).outerjoin(SentimentResult)
    if not include_demo:
        query = query.filter(Feedback.is_demo == False)
    if subject_id:
        query = query.filter(Feedback.subject_id == subject_id)
    if sentiment:
        query = query.filter(SentimentResult.predicted_sentiment.ilike(sentiment))
    
    records = query.order_by(Feedback.created_at.desc()).all()

    # Generate CSV stream
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Feedback ID",
        "Submission Date (UTC)",
        "Subject Code",
        "Subject Name",
        "Faculty Name",
        "Overall Rating (1-5)",
        "Teaching Clarity (1-5)",
        "Course Content (1-5)",
        "Practical Sessions (1-5)",
        "Predicted Sentiment",
        "Sentiment Confidence",
        "Model Used",
        "Extracted Themes",
        "Written Feedback",
        "Suggestions",
        "Is Anonymous",
        "Is Demo Record"
    ])

    for f in records:
        sent_label = f.sentiment.predicted_sentiment if f.sentiment else "Unanalyzed"
        conf = f.sentiment.confidence if f.sentiment else ""
        model = f.sentiment.model_name if f.sentiment else ""
        themes = f.sentiment.themes if f.sentiment else ""

        writer.writerow([
            f.id,
            f.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            f.subject.code,
            f.subject.name,
            f.subject.faculty_name,
            f.overall_rating,
            f.teaching_clarity,
            f.course_content,
            f.practical_sessions,
            sent_label,
            conf,
            model,
            themes,
            f.written_feedback.replace("\n", " "),
            (f.suggestions or "").replace("\n", " "),
            "Yes" if f.is_anonymous else "No",
            "Yes" if f.is_demo else "No"
        ])

    output.seek(0)
    filename = f"student_feedback_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
