import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.subject import Subject
from app.models.feedback import Feedback, SentimentResult
from app.schemas.feedback import (
    FeedbackCreate, FeedbackOut, SubjectOut, SubjectCreate, SentimentOut
)
from app.api.deps import (
    get_current_user, get_optional_current_user, require_admin, require_student
)
from app.services.sentiment import sentiment_engine

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    """List all available subjects for student evaluation."""
    return db.query(Subject).order_by(Subject.code).all()


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Add a new subject (Administrator only)."""
    existing = db.query(Subject).filter(Subject.code == subject_in.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject with code {subject_in.code.upper()} already exists"
        )
    
    sub = Subject(
        code=subject_in.code.upper().strip(),
        name=subject_in.name.strip(),
        department=subject_in.department.strip(),
        semester=subject_in.semester,
        faculty_name=subject_in.faculty_name.strip()
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/submit", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: FeedbackCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit feedback for a subject.
    Performs validation, duplicate checking, database persistence,
    and automatic real-time sentiment analysis.
    """
    subject = db.query(Subject).filter(Subject.id == fb_in.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified subject does not exist"
        )
    
    # Check duplicate submission within the same content and subject
    content_str = f"{fb_in.subject_id}_{fb_in.written_feedback.strip()}_{fb_in.overall_rating}"
    submission_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()

    existing_dup = db.query(Feedback).filter(Feedback.submission_hash == submission_hash).first()
    if existing_dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate feedback detected. You have already submitted identical feedback for this subject."
        )

    # Determine user association based on anonymous toggle
    user_id = None if fb_in.is_anonymous else (current_user.id if current_user else None)

    feedback_record = Feedback(
        user_id=user_id,
        subject_id=fb_in.subject_id,
        overall_rating=fb_in.overall_rating,
        teaching_clarity=fb_in.teaching_clarity,
        course_content=fb_in.course_content,
        practical_sessions=fb_in.practical_sessions,
        written_feedback=fb_in.written_feedback.strip(),
        suggestions=fb_in.suggestions.strip() if fb_in.suggestions else None,
        is_anonymous=fb_in.is_anonymous,
        is_demo=False,
        submission_hash=submission_hash
    )
    db.add(feedback_record)
    db.commit()
    db.refresh(feedback_record)

    # Perform Sentiment Analysis
    analysis = sentiment_engine.analyze(feedback_record.written_feedback)

    sentiment_record = SentimentResult(
        feedback_id=feedback_record.id,
        predicted_sentiment=analysis["sentiment"],
        confidence=analysis["confidence"],
        model_name=analysis["model_name"],
        themes=analysis["themes"]
    )
    db.add(sentiment_record)
    db.commit()
    db.refresh(sentiment_record)
    db.refresh(feedback_record)

    # Construct clean response
    return FeedbackOut(
        id=feedback_record.id,
        subject_id=subject.id,
        subject_code=subject.code,
        subject_name=subject.name,
        faculty_name=subject.faculty_name,
        overall_rating=feedback_record.overall_rating,
        teaching_clarity=feedback_record.teaching_clarity,
        course_content=feedback_record.course_content,
        practical_sessions=feedback_record.practical_sessions,
        written_feedback=feedback_record.written_feedback,
        suggestions=feedback_record.suggestions,
        is_anonymous=feedback_record.is_anonymous,
        is_demo=feedback_record.is_demo,
        created_at=feedback_record.created_at,
        sentiment=SentimentOut.model_validate(sentiment_record)
    )


@router.get("/history", response_model=List[FeedbackOut])
def get_student_history(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Retrieve non-anonymous feedback submissions made by the authenticated student."""
    records = (
        db.query(Feedback)
        .filter(Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    out = []
    for r in records:
        out.append(
            FeedbackOut(
                id=r.id,
                subject_id=r.subject.id,
                subject_code=r.subject.code,
                subject_name=r.subject.name,
                faculty_name=r.subject.faculty_name,
                overall_rating=r.overall_rating,
                teaching_clarity=r.teaching_clarity,
                course_content=r.course_content,
                practical_sessions=r.practical_sessions,
                written_feedback=r.written_feedback,
                suggestions=r.suggestions,
                is_anonymous=r.is_anonymous,
                is_demo=r.is_demo,
                created_at=r.created_at,
                sentiment=SentimentOut.model_validate(r.sentiment) if r.sentiment else None
            )
        )
    return out


@router.post("/rerun-sentiment")
def rerun_sentiment_analysis(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Re-analyze all feedback submissions using the updated sentiment engine (Admin only)."""
    feedbacks = db.query(Feedback).all()
    reanalyzed_count = 0

    for fb in feedbacks:
        analysis = sentiment_engine.analyze(fb.written_feedback)
        if fb.sentiment:
            fb.sentiment.predicted_sentiment = analysis["sentiment"]
            fb.sentiment.confidence = analysis["confidence"]
            fb.sentiment.model_name = analysis["model_name"]
            fb.sentiment.themes = analysis["themes"]
        else:
            new_sent = SentimentResult(
                feedback_id=fb.id,
                predicted_sentiment=analysis["sentiment"],
                confidence=analysis["confidence"],
                model_name=analysis["model_name"],
                themes=analysis["themes"]
            )
            db.add(new_sent)
        reanalyzed_count += 1
    
    db.commit()
    return {"message": f"Successfully re-analyzed {reanalyzed_count} feedback records", "count": reanalyzed_count}
