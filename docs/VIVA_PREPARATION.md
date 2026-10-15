# Student Feedback Assistant: Comprehensive Viva Preparation Guide

**Course**: Continuous Internal Evaluation (CIE) Project (20 Marks)  
**Domain**: Full-Stack Web Development, Applied Natural Language Processing, Retrieval-Augmented Generation (RAG)

---

## 1. Problem Statement & Motivation

### Existing Systems Limitations:
1. **Static & Opaque**: Traditional student feedback forms collect numerical ratings at the end of the semester, stored in paper sheets or raw Google Forms with zero actionable automated analysis.
2. **Ignored Qualitative Reviews**: Written comments are rarely analyzed systematically because manually reading hundreds of comments is labor-intensive.
3. **Lack of Instant Student Value**: Students submit reviews into a "black hole" without getting guidance on constructive writing or understanding course benchmarks.
4. **LLM Hallucination Risk**: Generic AI chatbots invent non-existent college rules, faculty names, or feedback numbers when queried.

### Proposed System Objectives:
- Provide a secure, full-stack multi-criteria evaluation platform for students.
- Perform real-time NLP sentiment analysis and academic thematic tag extraction on every written comment.
- Implement a grounded **Retrieval-Augmented Generation (RAG)** pipeline to answer educational and course questions with verifiable source citations.
- Calculate exact mathematical aggregates directly via SQL without LLM approximation.
- Deliver institutional transparency via interactive analytics, trend graphs, and CSV streaming exports.

---

## 2. Architecture & Technical Decisions

### Q: Why did you decouple the Frontend (React + Vite) and Backend (FastAPI)?
> **Answer**: Decoupling separates concerns cleanly:
> - The **FastAPI backend** serves as a stateless RESTful API exposing OpenAPI specs, handling database persistence, enforcing role-based JWT security, and executing NLP/RAG algorithms.
> - The **React frontend** delivers an interactive, single-page application (SPA) with client-side routing, optimistic UI updates, and data visualization via Recharts.
> - This architecture allows the frontend or backend to be scaled, tested, or migrated independently.

### Q: Why SQLite for local development instead of MySQL or PostgreSQL?
> **Answer**: SQLite is a serverless, self-contained, ACID-compliant relational database engine stored as a single file (`backend/data/student_assistant.db`). It requires zero background daemon configuration, making it portable and reliable for local college demonstration and viva evaluation. Because we use **SQLAlchemy ORM**, shifting to PostgreSQL in production requires merely changing the `DATABASE_URL` connection string with zero changes to queries or model code.

---

## 3. Natural Language Processing & Sentiment Analysis

### Q: How does your sentiment analysis engine work?
> **Answer**: We use an enhanced **VADER (Valence Aware Dictionary and sEntiment Reasoner)** rule-based engine:
> 1. VADER computes polarity scores: `pos`, `neu`, `neg`, and a normalized `compound` score from -1.0 (most negative) to +1.0 (most positive).
> 2. We apply domain thresholds:
>    - `compound >= 0.15` ➡️ **Positive**
>    - `compound <= -0.15` ➡️ **Negative**
>    - `pos >= 0.15` and `neg >= 0.15` with compound between -0.35 and 0.35 ➡️ **Mixed**
>    - Otherwise ➡️ **Neutral**
> 3. We compute a statistical confidence metric mapped from 0.40 to 0.99 based on valence intensity.

### Q: Why VADER instead of BERT or RoBERTa?
> **Answer**:
> - **Speed**: VADER executes in under 5 milliseconds per comment with zero GPU requirement.
> - **Zero Bloat**: Hugging Face neural transformers require 1.5GB to 3GB downloads (e.g. PyTorch/Torchvision) which frequently encounter wheel compilation and path-lock issues on Windows.
> - **Explainability**: VADER is completely interpretable—we can inspect exactly which words contributed to the positive or negative valence.

### Q: How do you handle Hinglish comments?
> **Answer**: We injected custom educational Hinglish vocabulary directly into VADER's internal lexicon:
> - Positive: *bohot achha, mast, shandaar, samajh aa gaya, clear ho gaya, maza aa gaya* (+2.0 to +3.0)
> - Negative: *bekar, bakwas, timepass, kuch samajh nahi aaya, doubt clear nahi hota* (-2.0 to -3.2)
> - Neutral: *theek thaak, average, chalega* (+0.0 to +0.2)

---

## 4. RAG Pipeline & Vector Search

### Q: What is RAG and why is it necessary?
> **Answer**: RAG stands for **Retrieval-Augmented Generation**. Instead of relying on an LLM's pre-trained memory (which can hallucinate), RAG retrieves authoritative document passages from an institutional knowledge base and injects them into the prompt as verified context.

### Q: Explain the step-by-step RAG workflow in this project.
> **Answer**:
> 1. **Ingestion**: Documents (`.md`, `.txt`, `.pdf`, `.json`) are uploaded and SHA-256 hashed for duplicate protection.
> 2. **Text Chunking**: Text is partitioned into ~500 character chunks with 50-character overlap along paragraph and sentence boundaries.
> 3. **Vector Representation**: Chunks are transformed into normalized **TF-IDF vectors** using sublinear term frequency scaling (`1 + log(tf)`) and smooth inverse document frequency (`log((N+1)/(df+1)) + 1`).
> 4. **Retrieval**: When a student asks a question, the query vector is compared against all chunk vectors using **Cosine Similarity**:
>    $$\text{Cosine Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
> 5. **Generation**: The top retrieved chunks and matching FAQs are passed into the LLM (or displayed in offline fallback mode) with source citations.

---

## 5. Security & Privacy

### Q: How is user authentication implemented?
> **Answer**:
> - Passwords are encrypted using **bcrypt** with random salt generation.
> - Upon login, the backend issues an **HMAC-SHA256 signed JSON Web Token (JWT)** containing the user's ID, email, role, and expiration timestamp.
> - Protected endpoints use FastAPI dependency injection (`require_admin`, `require_student`) to validate token signatures and enforce role guards.

### Q: How does Anonymous Feedback work?
> **Answer**: When the anonymous toggle is checked, the backend sets `user_id = null` in the `feedback` table. There is no foreign key or relational trace pointing to the student profile. The student's email, name, and IP address are completely excluded.

---

## 6. Top 25 Viva Examination Questions & Answers

1. **What is the project title and core purpose?**  
   *Student Feedback Assistant: An educational intelligence web app providing multi-criteria course evaluations, real-time sentiment analysis, and RAG-grounded conversational assistance.*

2. **What are the four rating dimensions?**  
   *Overall Satisfaction, Teaching Clarity, Course Content & Syllabus, and Practical & Laboratory Sessions.*

3. **How do you prevent duplicate submissions?**  
   *We compute a SHA-256 hash of `[subject_id + written_feedback + overall_rating]`. If an identical hash already exists in the database, the API returns a 409 Conflict.*

4. **What HTTP status codes does your API use?**  
   *200 OK (success), 201 Created (records persisted), 400 Bad Request (validation errors), 401 Unauthorized (invalid/missing token), 403 Forbidden (insufficient role privileges), 404 Not Found (resource missing), 409 Conflict (duplicate detected).*

5. **Where is data stored?**  
   *Relational data in SQLite (`backend/data/student_assistant.db`), vector index in JSON (`backend/data/vector_store/vector_index.json`), and documents in `backend/data/knowledge_base/`.*

6. **What is the role of SQLAlchemy?**  
   *It acts as an Object-Relational Mapper (ORM), allowing Python classes (`Feedback`, `Subject`, `User`) to map directly to database tables without writing raw SQL strings.*

7. **How does the system ensure non-LLM features work with zero API keys?**  
   *All evaluations, database operations, VADER sentiment, analytics charts, and RAG retrieval run 100% locally. The LLM router defaults to offline grounded passages if no API key is set.*

8. **What does the 'is_demo' flag do?**  
   *It flags the 50 seeded demonstration records so evaluators can toggle demo data on or off in the analytics filters.*

9. **How are academic themes detected in feedback?**  
   *Using compiled regular expressions matching domain keywords across 6 categories (e.g. 'lab', 'experiment' ➡️ `practical_sessions`).*

10. **How many FAQs are included in the starter database?**  
    *100 comprehensive, curated FAQs with unique IDs (`FAQ-001` through `FAQ-100`) covering all aspects of the application.*

11. **How is password security handled?**  
    *Through bcrypt hashing (`bcrypt.hashpw` with `gensalt()`). Passwords are never stored in plain text.*

12. **Can a student view admin analytics?**  
    *No. The backend dependency `require_admin` returns a 403 Forbidden error if a user with role `student` requests `/api/analytics/overview`.*

13. **What is Cosine Similarity?**  
    *A mathematical measure of similarity between two non-zero vectors in an inner product space, calculated as the dot product of their unit vectors.*

14. **How are the analytics charts rendered?**  
    *Using the Recharts SVG library in React, fed by live data fetched from the `/api/analytics/overview` endpoint.*

15. **What is Vite?**  
    *A next-generation frontend build tool that uses native ES modules in development for lightning-fast HMR and Rollup for optimized production bundling.*

16. **What is Pydantic v2 used for?**  
    *Data validation and schema serialization. It validates incoming request JSON and structures outgoing responses.*

17. **How does the system handle CORS?**  
    *FastAPI's `CORSMiddleware` is configured with `settings.CORS_ORIGINS` to allow requests originating from `http://localhost:5173`.*

18. **Can feedback be exported to CSV?**  
    *Yes. The `/api/analytics/export-csv` endpoint streams a UTF-8 CSV file containing ratings, sentiment, models, and text.*

19. **How does the AI Assistant handle statistical questions?**  
    *The smart query router identifies statistical keywords and invokes `AnalyticsService` directly, returning exact database numbers.*

20. **What is the purpose of the `/api/health` endpoint?**  
    *It returns a JSON health report detailing database connectivity, sentiment model name, LLM status, and indexed vector chunk counts.*

21. **How is the sentiment rerun endpoint useful?**  
    *When new lexicon rules or models are updated, `/api/feedback/rerun-sentiment` allows administrators to re-evaluate all historical feedback.*

22. **What happens if an uploaded document is not a supported file type?**  
    *The upload endpoint rejects it with a 400 Bad Request, allowing only `.md`, `.txt`, `.pdf`, and `.json`.*

23. **What is Tailwind CSS v4?**  
    *A utility-first CSS framework integrated via `@tailwindcss/vite` that compiles atomic CSS directly without requiring PostCSS configuration.*

24. **How many automated tests are included?**  
    *9 automated Pytest unit and integration tests verifying all core subsystems.*

25. **Can this project be extended for multi-college hosting?**  
    *Yes. By adding an `institution_id` column to subjects, feedback, and knowledge documents, the architecture can support multi-tenant SaaS hosting.*
