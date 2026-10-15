from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.knowledge import Conversation, ChatMessage
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse, ChatRatingRequest
from app.api.deps import get_optional_current_user
from app.services.chat_router import chat_router

router = APIRouter(prefix="/chat", tags=["AI Chatbot"])


@router.post("/query", response_model=ChatQueryResponse)
def query_assistant(
    req: ChatQueryRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a natural-language query to the Student Feedback Assistant.
    Routes queries to SQL Analytics for statistics, RAG vector store for institutional knowledge,
    and returns a cited, truthful, non-hallucinated response.
    """
    user_id = current_user.id if current_user else None
    return chat_router.query(
        query_text=req.message,
        session_id=req.session_id,
        subject_id=req.subject_id,
        db=db,
        user_id=user_id
    )


@router.post("/rate", status_code=status.HTTP_200_OK)
def rate_message_helpfulness(
    rating: ChatRatingRequest,
    db: Session = Depends(get_db)
):
    """Allow students to submit helpful/unhelpful rating on an assistant message."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == rating.message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    msg.is_helpful = rating.is_helpful
    db.commit()
    return {"message": "Rating recorded successfully"}


@router.get("/history/{session_id}")
def get_session_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve conversation history for a chat session."""
    conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
    if not conv:
        return {"session_id": session_id, "messages": []}

    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "session_id": session_id,
        "title": conv.title,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "query_type": m.query_type,
                "is_helpful": m.is_helpful,
                "created_at": m.created_at
            }
            for m in msgs
        ]
    }
