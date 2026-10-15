from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    
    # 1 to 5 rating scale
    overall_rating = Column(Integer, nullable=False)
    teaching_clarity = Column(Integer, nullable=False)
    course_content = Column(Integer, nullable=False)
    practical_sessions = Column(Integer, nullable=False)
    
    # Written textual feedback
    written_feedback = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=True)
    
    # Metadata
    is_anonymous = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)  # Flag for 50 seed demonstration records
    submission_hash = Column(String(64), nullable=True, index=True)  # Duplicate prevention
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="feedbacks")
    subject = relationship("Subject", back_populates="feedbacks")
    sentiment = relationship("SentimentResult", back_populates="feedback", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Feedback #{self.id} for Subject {self.subject_id} (Rating {self.overall_rating})>"


class SentimentResult(Base):
    __tablename__ = "sentiment_results"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Positive / Neutral / Negative / Mixed
    predicted_sentiment = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    model_name = Column(String(100), nullable=False)
    themes = Column(Text, nullable=True)  # JSON encoded list of themes
    analyzed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    feedback = relationship("Feedback", back_populates="sentiment")

    def __repr__(self):
        return f"<SentimentResult for Feedback #{self.feedback_id}: {self.predicted_sentiment}>"
