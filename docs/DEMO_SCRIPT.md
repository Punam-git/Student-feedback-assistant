# 5-Minute Faculty Demonstration Script: Student Feedback Assistant

Use this step-by-step walkthrough to present the project to faculty evaluators during your CIE viva examination.

---

## ⏱️ Minute 0:00 – 1:00: Problem & Architecture Introduction

1. **Open the Landing Page**:
   - URL: `http://localhost:5173/`
   - Point to the **CIE Continuous Improvement System** badge and live trust metrics bar (50+ verified submissions, 92%+ positive ratio, 4.12/5.00 satisfaction index).
2. **Explain the Decoupled Architecture**:
   > *"Good morning professors. This is the Student Feedback Assistant, developed for our 20-mark CIE evaluation project. It is built as a fully decoupled web application: a FastAPI Python backend utilizing SQLite and SQLAlchemy ORM, and a React 19 + TypeScript frontend with Tailwind CSS. It features real-time VADER sentiment analysis with custom Hinglish support and an offline RAG vector retrieval pipeline."*

---

## ⏱️ Minute 1:00 – 2:00: Student Experience & Real-Time Sentiment Tagging

1. **Navigate to Student Portal**:
   - Click **Student Portal** or go to `http://localhost:5173/dashboard`.
   - Point to the **Mid-Semester Evaluation Cycle urgency banner** and the **Semester Evaluation Progress bar** (60% completed).
2. **Open the Evaluation Form**:
   - Click **Evaluate Course** on *CS502 - Operating Systems & Concurrency*.
   - Point out the 4 multi-dimensional rating criteria (Overall, Teaching Clarity, Course Content, Practical Sessions).
   - Rate the stars: 5 for Clarity, 4 for Content, 4 for Practicals.
3. **Submit a Realistic Comment**:
   - In written feedback, type:  
     `"The whiteboard diagrams for virtual memory paging were crystal clear and very helpful. Bohot achha lecture tha!"`
   - Check the **Anonymous Submission** toggle and explain:
     > *"When this toggle is enabled, the backend sets user_id to null, ensuring strict cryptographic privacy for the student."*
   - Click **Submit Course Evaluation**.
4. **Demonstrate Instant NLP Sentiment Telemetry**:
   - The success modal pops up immediately:
     - Predicted Sentiment: **Positive**
     - Confidence Metric: **~85% Certainty**
     - Model Used: **VADER Rule-Based with Hinglish Lexicon**
     - Detected Themes: `#teaching_clarity`, `#course_content`

---

## ⏱️ Minute 2:00 – 3:30: Grounded AI Assistant & Smart Query Router

1. **Navigate to AI Assistant**:
   - Click **AI Assistant** or go to `http://localhost:5173/chat`.
   - Point out the **Provider Status Badge** in the header (*Offline Fallback Grounded Mode* or *Gemini API*).
2. **Demonstrate RAG Knowledge Grounding**:
   - Click the suggested prompt:  
     `"What is sentiment analysis in this application?"`
   - Show that the answer provides an accurate, scholarly explanation and displays **Retrieved Citations & Knowledge Chunks** citing `Sentiment Analysis Guide` and `Project Documentation`.
3. **Demonstrate SQL Analytics Intent (No Hallucination)**:
   - Ask:  
     `"What is the average rating for Operating Systems?"`
   - Point out the answer:
     > *"Notice that the assistant recognized this as a statistical query. Rather than guessing or hallucinating numbers, it queried our SQLite database directly and returned exact numbers: 4.18/5.00 overall rating and exact clarity averages."*
4. **Demonstrate Follow-Up Dialogue & Ratings**:
   - Ask: `"How can I write constructive feedback?"`
   - Click the **Copy Answer** button (shows "Copied") and the **Thumbs-Up** rating button.

---

## ⏱️ Minute 3:30 – 4:30: Administrator Analytics & Institutional Visualizations

1. **Switch to Administrator Session**:
   - On the top navbar, click the **Admin** pill button. The session instantly switches to `admin@institution.edu`.
2. **Navigate to Admin Analytics**:
   - URL: `http://localhost:5173/admin`
   - Highlight the **5 KPI Cards**: Total Submissions (50+), Satisfaction Index (4.12/5.0), Teaching Clarity Mean, Course Content Mean, and Practical Sessions Mean.
3. **Show the 4 Dynamic Charts (Recharts)**:
   - **Sentiment Donut Chart**: Hover over Positive, Neutral, Negative, Mixed slices.
   - **5-Star Rating Distribution**: Exact counts of 1-star through 5-star submissions.
   - **Subject Comparison Bar Chart**: Compare courses like CS501 vs CS502 side by side.
   - **Longitudinal Daily Trajectory**: Daily rating trendline over the semester.
4. **Demonstrate Filtering & CSV Export**:
   - Change the Subject filter to *CS501 - Data Structures* to show dynamic recalculation.
   - Click **Export CSV**: A real `.csv` file downloads to your computer in UTF-8 format.
   - Click **Rerun Sentiment**: Demonstrates batch re-evaluation of all database records.

---

## ⏱️ Minute 4:30 – 5:00: RAG Knowledge Management & Viva Telemetry

1. **Navigate to RAG Docs**:
   - URL: `http://localhost:5173/admin/knowledge`
   - Show the 5 indexed knowledge documents with their chunk counts (e.g. 23 chunks for Constructive Feedback Examples).
   - Point out the **100 Curated FAQs** directory.
2. **Show the System Status Page**:
   - URL: `http://localhost:5173/status`
   - Point to the live health check: FastAPI Backend Online (Python 3.13), Database Connected, VADER NLP active, and 76 vector chunks.
3. **Concluding Statement**:
   > *"In summary, the Student Feedback Assistant demonstrates a complete full-stack workflow: multi-dimensional evaluations, real-time sentiment analysis, mathematical data visualization, and verifiable RAG knowledge retrieval—all operating with zero cloud costs and zero hallucination risk. Thank you, professors! I am ready for questions."*
