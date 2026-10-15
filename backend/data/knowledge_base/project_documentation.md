# Student Feedback Assistant: System Architecture & Technical Documentation

## 1. Executive Summary & Purpose
The Student Feedback Assistant is a full-stack, enterprise-grade educational intelligence platform developed for college continuous internal evaluation (CIE). The system bridges the gap between raw student feedback and actionable academic leadership. It enables students to evaluate courses across specific pedagogical aspects (Teaching Clarity, Course Content, and Practical Sessions) and query institutional knowledge through an AI-powered conversational interface. For academic administrators, the system provides real-time sentiment distribution, thematic clustering, rating trends, and CSV data export.

## 2. Architectural Blueprint & Technology Stack
The platform adopts a decoupled client-server architecture:
- **Frontend Layer**: Built with React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, and Recharts. Communication is conducted via asynchronous REST calls authenticated through JSON Web Tokens (JWT).
- **Backend Application Layer**: FastAPI (Python 3.10+) running an asynchronous event loop, with strict Pydantic schemas for request validation, data serialization, and role-based security guards.
- **Persistence Layer**: Relational database managed through SQLAlchemy ORM, backed locally by SQLite with thread safety, foreign key constraints, and performance indexes.
- **NLP & Sentiment Analysis Engine**: Domain-enhanced VADER (Valence Aware Dictionary and sEntiment Reasoner) with Hinglish lexical extensions, providing rule-based explainability, compound valence scoring, and thematic tag extraction.
- **RAG & Knowledge Retrieval**: Vector-indexed retrieval augmented generation. Documents and FAQs are chunked, normalized, and indexed into a local vector store. Queries are evaluated via semantic similarity matching with threshold filtering.
- **AI Provider Layer**: Modular LLM provider abstraction supporting Google Gemini API (free tier) with zero-key fallback mode that serves grounded, verified source passages without hallucination.

## 3. End-to-End Data Flow: From Form Submission to Knowledge Retrieval
1. **Feedback Ingestion**:
   - The student completes the multi-dimensional evaluation form.
   - Frontend performs client-side field validation and rating checks.
   - A cryptographic SHA-256 hash of `[subject_id + content + rating]` is verified on the backend to prevent accidental duplicate clicks.
   - The feedback is persisted into the `feedback` table. If the anonymous toggle is active, `user_id` is stored as `null`.
2. **Synchronous Sentiment & Theme Tagging**:
   - The text comment passes through `SentimentEngine.analyze()`.
   - Polarity scores are calculated: Positive (compound >= 0.15), Negative (compound <= -0.15), Mixed (pos & neg >= 0.15), or Neutral.
   - Domain regex matches extract academic tags: `teaching_clarity`, `practical_sessions`, `course_content`, `pace_and_workload`, `classroom_environment`, `exams_and_evaluation`.
   - Results are committed to the `sentiment_results` table with foreign key linkage.
3. **Analytics Aggregation**:
   - When administrators access the dashboard, direct SQL aggregations compute exact rating distributions, subject means, and chronological trend series. LLMs are never used to invent numbers.
4. **Conversational Query Resolution**:
   - User inputs a question in the AI Chat Assistant.
   - **Smart Query Router** classifies user intent into:
     - **Statistical Intent**: Triggered by queries like "What is the average rating for Operating Systems?" -> Dispatches direct SQL query, returns exact numbers.
     - **Knowledge / Educational Intent**: Triggered by queries like "What is sentiment analysis?" or "How to write constructive feedback?" -> Searches the vector store and FAQ database, retrieves top-k chunks, cites source titles, and crafts a grounded explanation.
     - **General Guidance**: Formulates pedagogical advice governed by safety guardrails.

## 4. Ingesting Documents & Adding FAQs
- **Knowledge Documents**: Administrators can upload Markdown (`.md`), Plain Text (`.txt`), PDF (`.pdf`), and JSON (`.json`) files through the Knowledge Management interface. Documents are validated for size (< 10MB), text-extracted, chunked into ~500 character units with overlap, hashed for deduplication, and indexed into the vector store.
- **FAQ Management**: FAQs can be added, updated, or toggled active/inactive via `/api/knowledge/faqs`. FAQs are matched using direct semantic indexing.

## 5. Configuring AI Providers & Fallback Mode
- The system reads `LLM_PROVIDER` and `LLM_API_KEY` from `.env`.
- Supported providers:
  - `gemini`: Google Gemini API using `gemini-1.5-flash` or `gemini-2.0-flash`.
  - `fallback`: Offline mode when no API key is supplied. In fallback mode, the assistant retrieves the most relevant verified document passages and displays them with source badges, explicitly stating: *"AI generation unavailable (no API key configured). Showing verified retrieved passages."*

## 6. Troubleshooting Common Issues
- **ChromaDB / Package Lock**: If native C-extensions encounter file locks on Windows, the system gracefully shifts to the integrated pure-Python cosine-similarity vector store.
- **Duplicate Feedback Warning (409 Conflict)**: Occurs if identical feedback is submitted twice for the same subject. Changing the comment text or rating allows re-submission.
- **CORS Errors**: Verify that the frontend origin (`http://localhost:5173`) is listed in `settings.CORS_ORIGINS`.
