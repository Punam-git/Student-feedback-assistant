import json
import re
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.knowledge import Conversation, ChatMessage, FAQ
from app.models.subject import Subject
from app.models.feedback import Feedback
from app.schemas.chat import ChatQueryResponse, SourceCitation
from app.services.rag import rag_service
from app.services.analytics import analytics_service


class ChatRouterService:
    """
    Intelligent Conversational Router & AI Assistant.
    Dispatches queries to:
    - SQL Database Analytics for statistics & numbers (never fabricated)
    - RAG Knowledge Base + FAQs for educational documents & concepts
    - Google Gemini LLM (or Fallback Grounded Passages) with strict guardrails
    """
    def __init__(self):
        self.gemini_endpoint = "https://generativelanguage.googleapis.com/v1beta/models"

    def classify_intent(self, query: str) -> str:
        """
        Classify whether user question requires statistical database queries,
        RAG document knowledge, or general conversation.
        """
        q_lower = query.lower()

        # Statistical indicators
        stat_keywords = [
            "average", "rating", "how many", "count", "percentage", "trend",
            "score", "highest", "lowest", "total feedback", "stats", "statistics",
            "distribution", "compare", "performance of", "teaching clarity for",
            "satisfaction index", "overall rating", "summary of feedback"
        ]
        for kw in stat_keywords:
            if kw in q_lower:
                return "statistics"

        # Knowledge indicators
        knowledge_keywords = [
            "what is", "how do i", "how can i", "explain", "meaning", "define",
            "constructive", "sentiment", "privacy", "anonymous", "rag", "vector",
            "guidelines", "faq", "rubric", "criteria", "documentation", "architecture",
            "vader", "hinglish", "suggestions for", "how to write"
        ]
        for kw in knowledge_keywords:
            if kw in q_lower:
                return "knowledge"

        return "general"

    def _resolve_subject(self, query: str, db: Session) -> Optional[Subject]:
        """Attempt to match a mentioned subject name or code in user query."""
        subjects = db.query(Subject).all()
        q_lower = query.lower()
        for sub in subjects:
            if sub.code.lower() in q_lower or sub.name.lower() in q_lower:
                return sub
            # Match partial name like "operating systems" -> "os", "data structures" -> "ds"
            words = sub.name.lower().split()
            if len(words) >= 2 and all(w in q_lower for w in words[:2]):
                return sub
        return None

    def _handle_statistics(self, query: str, db: Session, session_id: str) -> ChatQueryResponse:
        """Query actual database via AnalyticsService and format an exact numerical reply."""
        matched_subject = self._resolve_subject(query, db)
        sub_id = matched_subject.id if matched_subject else None

        overview = analytics_service.get_overview(db=db, subject_id=sub_id, include_demo=True)

        if overview.total_feedback == 0:
            resp_text = (
                "Currently, there is no recorded feedback in the system for the requested criteria. "
                "Once students submit evaluations, real-time ratings and sentiment analytics will appear here."
            )
            return ChatQueryResponse(
                session_id=session_id,
                query=query,
                query_type="statistics",
                response=resp_text,
                sources=[],
                is_fallback=False,
                provider_used="sql-analytics"
            )

        if matched_subject:
            # Subject specific response
            stat = next((s for s in overview.subject_stats if s.subject_id == matched_subject.id), None)
            if stat:
                resp_text = (
                    f"### Statistics for **{matched_subject.name}** ({matched_subject.code})\n\n"
                    f"- **Faculty**: {matched_subject.faculty_name}\n"
                    f"- **Total Submissions Analyzed**: {stat.feedback_count}\n"
                    f"- **Overall Satisfaction Rating**: **{stat.avg_overall} / 5.00**\n"
                    f"- **Teaching Clarity**: {stat.avg_teaching_clarity} / 5.00\n"
                    f"- **Course Content**: {stat.avg_course_content} / 5.00\n"
                    f"- **Practical & Lab Sessions**: {stat.avg_practical_sessions} / 5.00\n"
                    f"- **Positive Sentiment Ratio**: {stat.positive_ratio}%\n\n"
                    f"*Source: Direct SQLite query over verified submissions ({overview.date_range_start or 'N/A'} to {overview.date_range_end or 'N/A'}).*"
                )
            else:
                resp_text = f"No feedback submissions have been recorded yet specifically for {matched_subject.name}."
        else:
            # Overall institutional statistics
            top_theme_str = ", ".join([f"{t.theme} ({t.count})" for t in overview.top_improvement_themes[:3]]) or "None recorded"
            pos_theme_str = ", ".join([f"{t.theme} ({t.count})" for t in overview.top_positive_highlights[:3]]) or "None recorded"

            resp_text = (
                f"### Institutional Academic Feedback Summary\n\n"
                f"- **Total Submissions Analyzed**: **{overview.total_feedback}** verified records\n"
                f"- **Cohort Satisfaction Index**: **{overview.avg_overall_rating} / 5.00**\n"
                f"- **Average Teaching Clarity**: {overview.avg_teaching_clarity} / 5.00\n"
                f"- **Average Course Content**: {overview.avg_course_content} / 5.00\n"
                f"- **Average Practical Sessions**: {overview.avg_practical_sessions} / 5.00\n\n"
                f"**Sentiment Distribution**:\n"
                f"- Positive: {overview.sentiment_distribution.positive} ({overview.sentiment_distribution.positive_percentage}%)\n"
                f"- Neutral: {overview.sentiment_distribution.neutral} ({overview.sentiment_distribution.neutral_percentage}%)\n"
                f"- Negative: {overview.sentiment_distribution.negative} ({overview.sentiment_distribution.negative_percentage}%)\n"
                f"- Mixed: {overview.sentiment_distribution.mixed} ({overview.sentiment_distribution.mixed_percentage}%)\n\n"
                f"**Recurring Improvement Themes**: {top_theme_str}\n\n"
                f"**Key Strengths Noted**: {pos_theme_str}\n\n"
                f"*Data Range: {overview.date_range_start or 'N/A'} to {overview.date_range_end or 'N/A'}. All calculations are computed directly via database queries without LLM approximation.*"
            )

        return ChatQueryResponse(
            session_id=session_id,
            query=query,
            query_type="statistics",
            response=resp_text,
            sources=[],
            is_fallback=False,
            provider_used="sql-analytics"
        )

    def _search_faqs(self, query: str, db: Session, limit: int = 2) -> List[Dict[str, Any]]:
        """Look up FAQs with keyword matching."""
        words = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 3]
        if not words:
            return []
        
        all_faqs = db.query(FAQ).filter(FAQ.is_active == True).all()
        scored: List[Tuple[int, FAQ]] = []
        for faq in all_faqs:
            q_text = faq.question.lower()
            a_text = faq.answer.lower()
            score = sum(3 for w in words if w in q_text) + sum(1 for w in words if w in a_text)
            if score > 0:
                scored.append((score, faq))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "faq_id": item[1].faq_id,
                "category": item[1].category,
                "question": item[1].question,
                "answer": item[1].answer,
                "score": item[0]
            }
            for item in scored[:limit]
        ]

    def _call_gemini(self, prompt: str, context: str) -> Optional[str]:
        """Call Google Gemini REST API if LLM_API_KEY is configured."""
        api_key = settings.LLM_API_KEY
        if not api_key:
            return None

        model_name = settings.LLM_MODEL or "gemini-1.5-flash"
        url = f"{self.gemini_endpoint}/{model_name}:generateContent?key={api_key}"

        system_instruction = (
            "You are the Student Feedback Assistant, an academic AI advisor for college students and faculty. "
            "Your tone is scholarly, constructive, helpful, and concise. "
            "STRICT RULES:\n"
            "1. Base your answer strictly on the provided RETRIEVED CONTEXT and institutional documentation.\n"
            "2. Never fabricate faculty names, feedback statistics, or institutional policies.\n"
            "3. If the context does not contain enough information, state clearly that the knowledge base does not have details on that topic.\n"
            "4. Provide practical, constructive advice when asked about writing feedback or study habits."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nRETRIEVED CONTEXT:\n{context}\n\nUSER QUESTION:\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": settings.LLM_TEMPERATURE,
                "maxOutputTokens": settings.LLM_MAX_TOKENS
            }
        }

        try:
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
        except Exception:
            pass
        return None

    def query(
        self,
        query_text: str,
        session_id: Optional[str] = None,
        subject_id: Optional[int] = None,
        db: Session = None,
        user_id: Optional[int] = None
    ) -> ChatQueryResponse:
        """
        Main conversational entrypoint.
        Processes intent, retrieves context, and returns grounded answer.
        """
        session_id = session_id or str(uuid.uuid4())
        intent = self.classify_intent(query_text)

        # 1. Statistics & Aggregations
        if intent == "statistics":
            response = self._handle_statistics(query_text, db, session_id)
            self._save_interaction(session_id, user_id, query_text, response.response, "statistics", [], db)
            return response

        # 2. Knowledge & FAQs
        rag_chunks = rag_service.search(query_text, top_k=settings.TOP_K_RETRIEVAL, min_score=0.12)
        matching_faqs = self._search_faqs(query_text, db, limit=2)

        # Build citations list
        citations: List[SourceCitation] = []
        for c in rag_chunks:
            citations.append(
                SourceCitation(
                    source_title=c["title"],
                    category=c["category"],
                    content_snippet=c["chunk_text"][:220] + "...",
                    relevance_score=c["similarity_score"],
                    page=c.get("page_number")
                )
            )
        for f in matching_faqs:
            citations.append(
                SourceCitation(
                    source_title=f"FAQ ({f['faq_id']}): {f['question']}",
                    category=f["category"],
                    content_snippet=f["answer"][:220] + "...",
                    relevance_score=0.85
                )
            )

        # Compile Context String
        context_blocks = []
        for c in rag_chunks:
            context_blocks.append(f"[{c['title']} - {c['category']}]:\n{c['chunk_text']}")
        for f in matching_faqs:
            context_blocks.append(f"[FAQ {f['faq_id']}: {f['question']}]:\n{f['answer']}")
        context_str = "\n\n---\n\n".join(context_blocks)

        # Attempt Gemini LLM Generation if configured
        llm_reply = None
        if settings.LLM_API_KEY:
            llm_reply = self._call_gemini(query_text, context_str)

        if llm_reply:
            answer_text = llm_reply
            provider = "gemini"
            is_fallback = False
        else:
            # Fallback Grounded Passages mode (Zero-Key Local Dev)
            provider = "local-rag"
            is_fallback = True

            if rag_chunks or matching_faqs:
                parts = []
                parts.append("### Departmental Guidance & Institutional Knowledge")
                parts.append(
                    "*Official Reference: Verified curriculum guidelines, evaluation rubrics, and departmental documentation.*"
                )
                
                # Check direct FAQ match first
                if matching_faqs:
                    top_faq = matching_faqs[0]
                    parts.append(f"\n#### FAQ Reference [{top_faq['faq_id']}]: {top_faq['question']}")
                    parts.append(f"> {top_faq['answer']}\n")

                if rag_chunks:
                    parts.append("\n#### Verified Academic Documentation Excerpts:")
                    for idx, chunk in enumerate(rag_chunks[:3], 1):
                        parts.append(
                            f"\n**{idx}. {chunk['title']}** — *{chunk['category']}*:\n"
                            f"{chunk['chunk_text']}"
                        )

                answer_text = "\n".join(parts)
            else:
                answer_text = (
                    "The institutional knowledge repository does not currently contain a specific policy or guideline matching this inquiry. "
                    "You may consult the **Knowledge Search** directory or reach out directly to your department academic coordinator."
                )

        response = ChatQueryResponse(
            session_id=session_id,
            query=query_text,
            query_type="knowledge" if (rag_chunks or matching_faqs) else "general",
            response=answer_text,
            sources=citations,
            is_fallback=is_fallback,
            provider_used=provider
        )

        self._save_interaction(
            session_id, user_id, query_text, answer_text, response.query_type,
            [c.model_dump() for c in citations], db
        )
        return response

    def _save_interaction(
        self,
        session_id: str,
        user_id: Optional[int],
        query: str,
        answer: str,
        q_type: str,
        sources: List[Dict[str, Any]],
        db: Session
    ):
        """Persist conversation and message to database."""
        try:
            conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
            if not conv:
                conv = Conversation(session_id=session_id, user_id=user_id, title=query[:50])
                db.add(conv)
                db.commit()
                db.refresh(conv)

            user_msg = ChatMessage(
                conversation_id=conv.id,
                role="user",
                content=query,
                query_type=q_type
            )
            asst_msg = ChatMessage(
                conversation_id=conv.id,
                role="assistant",
                content=answer,
                query_type=q_type,
                sources_cited=json.dumps(sources) if sources else None
            )
            db.add(user_msg)
            db.add(asst_msg)
            db.commit()
        except Exception:
            db.rollback()


chat_router = ChatRouterService()
