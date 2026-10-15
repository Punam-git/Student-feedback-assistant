from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import engine, Base, get_db
from app.models.user import User
from app.core.security import hash_password
from app.services.rag import rag_service
from app.services.sentiment import sentiment_engine

from app.api.routes_auth import router as auth_router
from app.api.routes_feedback import router as feedback_router
from app.api.routes_analytics import router as analytics_router
from app.api.routes_knowledge import router as knowledge_router
from app.api.routes_chat import router as chat_router

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Full-stack educational intelligence platform for CIE student evaluations, RAG knowledge retrieval, and real-time sentiment analytics."
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(feedback_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(knowledge_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def on_startup():
    """Ensure database schema is created and default administrative account exists."""
    Base.metadata.create_all(bind=engine)
    
    # Check default admin account
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL.lower()).first()
        if not admin:
            admin_user = User(
                email=settings.ADMIN_EMAIL.lower(),
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_NAME,
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


from sqlalchemy import text

@app.get("/api/health", tags=["Health & Status"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint exposing system readiness and provider telemetry."""
    # Check database connectivity
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    llm_status = "online (Gemini API)" if settings.LLM_API_KEY else "offline fallback (zero-key mode)"
    
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "database": db_status,
        "sentiment_engine": sentiment_engine.model_name,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_status": llm_status,
        "indexed_vector_chunks": len(rag_service.vector_store.chunks)
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "documentation": "/docs",
        "health": "/api/health"
    }
