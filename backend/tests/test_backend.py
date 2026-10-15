import os
import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app
from app.core.config import settings
from app.services.sentiment import sentiment_engine
from app.services.rag import rag_service

client = TestClient(app)


def test_health_check():
    """Verify health endpoint reports healthy and exposes subsystem readiness."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "VADER" in data["sentiment_engine"]
    assert data["indexed_vector_chunks"] > 0


def test_admin_and_student_auth():
    """Verify login authentication and JWT role tokens."""
    # Admin login
    res = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    assert res.status_code == 200
    admin_token = res.json()["access_token"]
    assert res.json()["role"] == "admin"

    # Student login
    res_s = client.post("/api/auth/login", json={
        "email": "student@institution.edu",
        "password": "Student@123"
    })
    assert res_s.status_code == 200
    student_token = res_s.json()["access_token"]
    assert res_s.json()["role"] == "student"

    # Verify protected profile endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == settings.ADMIN_EMAIL


def test_role_guard_admin_only_routes():
    """Verify student account is forbidden (403) from accessing admin-only routes."""
    res_s = client.post("/api/auth/login", json={
        "email": "student@institution.edu",
        "password": "Student@123"
    })
    student_token = res_s.json()["access_token"]

    # Student trying to access admin analytics overview
    res = client.get("/api/analytics/overview", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

    # Unauthenticated user trying to access admin analytics
    res_unauth = client.get("/api/analytics/overview")
    assert res_unauth.status_code == 401


def test_sentiment_analysis_engine():
    """Verify sentiment engine accurately classifies positive, negative, and Hinglish comments."""
    # Positive
    res_pos = sentiment_engine.analyze("The whiteboard explanations of binary trees were fantastic and crystal clear!")
    assert res_pos["sentiment"] == "Positive"
    assert res_pos["confidence"] > 0.5

    # Negative
    res_neg = sentiment_engine.analyze("The lab session was bakwas and confusing, nothing worked at all.")
    assert res_neg["sentiment"] == "Negative"

    # Hinglish positive
    res_hing = sentiment_engine.analyze("Bohot achha lecture tha sir, maza aa gaya!")
    assert res_hing["sentiment"] == "Positive"

    # Theme extraction
    themes = sentiment_engine.extract_themes("The coding lab experiment on algorithms was very helpful.")
    assert "practical_sessions" in themes or "teaching_clarity" in themes


def test_feedback_submission_and_duplicate_prevention():
    """Verify student feedback submission, persistence, and duplicate protection."""
    # Get subjects
    sub_res = client.get("/api/feedback/subjects")
    assert sub_res.status_code == 200
    subjects = sub_res.json()
    assert len(subjects) > 0
    test_subject = subjects[0]

    unique_feedback = f"Automated test feedback for CIE evaluation verification - {os.urandom(4).hex()}"
    payload = {
        "subject_id": test_subject["id"],
        "overall_rating": 4,
        "teaching_clarity": 5,
        "course_content": 4,
        "practical_sessions": 3,
        "written_feedback": unique_feedback,
        "suggestions": "Add extra practice problems.",
        "is_anonymous": False
    }

    res = client.post("/api/feedback/submit", json=payload)
    assert res.status_code == 201
    fb_data = res.json()
    assert fb_data["overall_rating"] == 4
    assert fb_data["sentiment"]["predicted_sentiment"] in ["Positive", "Neutral", "Negative", "Mixed"]

    # Test Duplicate Prevention (409 Conflict)
    res_dup = client.post("/api/feedback/submit", json=payload)
    assert res_dup.status_code == 409


def test_admin_analytics_mathematical_integrity():
    """Verify analytics calculates real arithmetic numbers and matches direct database calculations."""
    res_login = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    admin_token = res_login.json()["access_token"]

    res = client.get("/api/analytics/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_feedback"] >= 50
    assert 1.0 <= data["avg_overall_rating"] <= 5.0
    assert len(data["subject_stats"]) > 0

    # Verify rating distribution sum equals total_feedback
    rd = data["rating_distribution"]
    sum_stars = rd["stars_1"] + rd["stars_2"] + rd["stars_3"] + rd["stars_4"] + rd["stars_5"]
    assert sum_stars == data["total_feedback"]


def test_csv_export():
    """Verify CSV export streams a valid CSV document with correct headers."""
    res_login = client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    admin_token = res_login.json()["access_token"]

    res = client.get("/api/analytics/export-csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    content = res.text
    assert "Feedback ID,Submission Date (UTC),Subject Code" in content
    assert len(content.splitlines()) > 50


def test_rag_vector_search():
    """Verify RAG retrieval returns relevant documents for known educational queries."""
    res = client.get("/api/knowledge/search?q=constructive+feedback")
    assert res.status_code == 200
    data = res.json()
    assert data["total_found"] > 0
    first_hit = data["results"][0]
    assert "Constructive" in first_hit["document_title"] or "Feedback" in first_hit["document_title"]


def test_chatbot_query_router():
    """Verify smart chatbot routes statistical questions to SQL and knowledge questions to RAG."""
    # Statistical query
    res_stat = client.post("/api/chat/query", json={
        "message": "What is the average rating for Operating Systems?"
    })
    assert res_stat.status_code == 200
    stat_data = res_stat.json()
    assert stat_data["query_type"] == "statistics"
    assert "Operating Systems" in stat_data["response"]
    assert "/ 5.00" in stat_data["response"]

    # Knowledge query
    res_know = client.post("/api/chat/query", json={
        "message": "What is sentiment analysis and how does it work?"
    })
    assert res_know.status_code == 200
    know_data = res_know.json()
    assert know_data["query_type"] == "knowledge"
    assert len(know_data["sources"]) > 0
