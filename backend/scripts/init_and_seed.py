import os
import sys
import json
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.database.session import engine, SessionLocal, Base
from app.models.user import User
from app.models.subject import Subject
from app.models.feedback import Feedback, SentimentResult
from app.models.knowledge import KnowledgeDocument, FAQ
from app.core.security import hash_password
from app.core.config import settings
from app.services.sentiment import sentiment_engine
from app.services.rag import rag_service

SUBJECTS_DATA = [
    {
        "code": "CS501",
        "name": "Data Structures & Algorithms",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "faculty_name": "Prof. Rajesh Sharma"
    },
    {
        "code": "CS502",
        "name": "Operating Systems & Concurrency",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "faculty_name": "Dr. Sunita Rao"
    },
    {
        "code": "CS503",
        "name": "Database Management Systems",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "faculty_name": "Prof. Amit Verma"
    },
    {
        "code": "CS504",
        "name": "Computer Networks & Protocols",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "faculty_name": "Dr. Priya Nair"
    },
    {
        "code": "CS505",
        "name": "Machine Learning Foundations",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "faculty_name": "Dr. Vikramaditya Sen"
    },
    {
        "code": "CS506",
        "name": "Software Engineering & DevOps",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "faculty_name": "Prof. Deepa Kulkarni"
    }
]

# 50 varied demonstration feedback comments (Positive, Negative, Neutral, Mixed, Hinglish, Short, Detailed)
DEMO_FEEDBACK_DATA = [
    # Positive
    ("CS501", 5, 5, 5, 5, "The step-by-step whiteboard derivations of dynamic programming problems made tree-knapsack crystal clear. Excellent interactive approach!", "Please provide more competitive programming practice problems."),
    ("CS501", 5, 5, 4, 4, "Bohot achha lecture tha. Graph algorithms and Dijkstra concept cleared immediately with visual slides.", "None, the pace is perfect."),
    ("CS502", 4, 5, 4, 4, "Operating systems concurrency models were explained with great real-world analogies. Synchronization primitives make sense now.", "Would love a take-home thread pool simulation."),
    ("CS503", 5, 5, 5, 5, "SQL indexing and B-tree internals were demystified thoroughly. Hands-on query optimization was outstanding.", "Keep doing the live database benchmarking exercises!"),
    ("CS504", 5, 4, 5, 5, "Wireshark packet capture lab was hands-on and insightful. Learned TCP three-way handshake practically.", "Allow more time during the routing protocol debugging lab."),
    ("CS505", 5, 5, 5, 5, "Dr. Sen is brilliant at math behind gradient descent. Shandaar explanation of backpropagation and loss curves.", "Share the Jupyter notebook templates before the lecture."),
    ("CS506", 5, 5, 4, 5, "DevOps CI/CD pipeline automation lab was exceptional. Setting up GitHub actions gave genuine industry exposure.", "Include a session on Kubernetes deployments."),
    ("CS501", 4, 4, 5, 4, "Binary search tree rebalancing derivations were methodical and easy to retain for the upcoming CIE test.", "Provide summary revision cheat sheets before exams."),
    ("CS502", 5, 5, 5, 4, "Deadlock avoidance Banker's algorithm was deconstructed with crisp mathematical rigor. Very engaging faculty.", "Upload recorded recap snippets for absent students."),
    ("CS503", 4, 5, 4, 4, "Transaction isolation levels and ACID properties were taught with banking transaction examples. Very relatable.", "Add more questions on distributed transactions."),
    ("CS505", 5, 5, 5, 5, "Supervised learning algorithms and bias-variance tradeoff lecture was one of the best lectures of the semester.", "More case studies on computer vision would be great."),
    ("CS504", 4, 4, 4, 5, "Subnetting and CIDR address calculation techniques were taught with interactive quiz questions.", "Hold an extra doubt clarification hour."),
    
    # Negative / Critical
    ("CS502", 1, 2, 2, 1, "The virtual memory paging lecture was rushed and deeply confusing. Slides had heavy math without intermediate steps.", "Please slow down and solve at least two full page replacement examples on the board."),
    ("CS503", 2, 2, 3, 1, "Lab me kuch nahi sikhaya. The database normalization exercise had broken SQL scripts and no TA assistance.", "Fix the PostgreSQL container environment before lab sessions begin."),
    ("CS504", 2, 2, 3, 2, "Boring and difficult to follow. The professor speaks too softly from the podium and flips slides too quickly.", "Use a microphone and give students time to take notes."),
    ("CS501", 2, 2, 3, 2, "Red-Black tree rotations were skipped after only five minutes. Homework problems are way harder than lecture material.", "Align tutorial problem difficulty with the classroom explanations."),
    ("CS505", 2, 1, 3, 1, "Too much theoretical proofs and zero python coding examples for support vector machines.", "Demonstrate scikit-learn code side by side with the dual optimization formulation."),
    ("CS506", 2, 2, 3, 1, "Software testing lab environment was not configured. Half the systems in lab 3 lacked Docker permissions.", "Ensure system administrators verify student user permissions beforehand."),
    ("CS502", 1, 1, 2, 1, "Bakwas lab session. The process scheduling C code had segmentation faults and no debugging guidance was provided.", "Supply verified starter code with automated test scripts."),
    ("CS504", 2, 2, 2, 2, "Socket programming assignment deadline is too tight given we have two other CIE submissions this week.", "Please extend the client-server socket submission by three days."),
    ("CS503", 2, 2, 2, 1, "Notes bekar hain. The provided slides are scanned low-resolution PDF pages with cut-off diagrams.", "Upload original vector slide decks in PDF format."),
    ("CS505", 1, 2, 2, 1, "Kaisa padhate hain samajh nahi aaya. The transition from linear regression to neural networks was way too abrupt.", "Include an introductory bridge tutorial on linear algebra fundamentals."),

    # Mixed
    ("CS501", 3, 4, 3, 2, "Theory on minimum spanning trees was well delivered, but the Kruskal coding session was disorganized and unguided.", "Have lab instructors demonstrate union-find data structure before starting lab."),
    ("CS502", 3, 4, 3, 2, "The lecturer explains concepts clearly, but the syllabus pace is too fast and assignments are overwhelmingly heavy.", "Moderate the weekly homework workload."),
    ("CS503", 3, 3, 4, 3, "ER modeling was interesting, but relational algebra symbols were confusing and not practiced adequately.", "Conduct a dedicated practice tutorial on complex joins and projections."),
    ("CS504", 3, 4, 3, 2, "Good conceptual overview of OSI layers, however the packet tracer simulation crashed repeatedly on lab PCs.", "Update the network simulation software on the college desktops."),
    ("CS505", 3, 3, 4, 3, "The theory is very deep and inspiring, but without GPU access the deep learning assignments took 10 hours to train.", "Provide Google Colab Pro credits or campus server access."),
    ("CS506", 3, 4, 3, 3, "Agile scrum methodology theory was engaging, but the team sprint grading rubric felt arbitrary.", "Publish the grading rubric with transparent point allocations."),
    ("CS501", 3, 3, 4, 2, "Helpful hain teacher lekin doubts class me address nahi hote due to lack of time.", "Reserve the last 10 minutes of every lecture exclusively for student Q&A."),
    ("CS502", 3, 4, 3, 2, "Operating system concepts are solid, but sometimes Hindi and English mix creates confusion in technical terminology.", "Stick to standard technical English terms for OS primitives."),

    # Neutral / Balanced
    ("CS503", 3, 3, 3, 3, "The course coverage matches the prescribed university syllabus. Average delivery without anything particularly remarkable.", "Add more modern NoSQL comparison topics."),
    ("CS504", 3, 3, 3, 3, "Theek thaak delivery. Standard textbooks are followed. Meets expectations.", "Include real-world cybersecurity incident discussions."),
    ("CS506", 3, 3, 3, 3, "Standard lecture style. Presentation slides are comprehensive.", "Incorporate guest lectures from industry engineering managers."),
    ("CS501", 3, 3, 3, 3, "Fair course delivery. Pacing is moderate.", "Upload problem set solutions after the submission cutoff."),
    ("CS505", 3, 3, 3, 3, "Acceptable introduction to data science and clustering. Math rigor is moderate.", "Give clear reading assignments from Bishop or Murphy."),
    ("CS502", 3, 3, 3, 3, "Standard course on scheduling algorithms and memory management. Content is fine.", "A mini-project option would make the course more memorable."),

    # Short & Hinglish
    ("CS501", 5, 5, 5, 5, "Mast class thi! Samajh aa gaya sab.", "Keep it up sir!"),
    ("CS502", 1, 1, 1, 1, "Bekar. Kuch samajh nahi aaya.", "Padhane ka style change karo please."),
    ("CS503", 4, 4, 4, 4, "Achha tha. SQL queries clear ho gaya.", "Thoda slow boliye."),
    ("CS504", 2, 2, 2, 1, "Doubt clear nahi hota lab me.", "Lab assistants need training."),
    ("CS505", 5, 5, 5, 5, "Maza aa gaya! Best teacher for machine learning.", "More live demos."),
    ("CS506", 4, 4, 4, 3, "Syllabus fast chal raha hai but content is good.", "Give PPTs in advance."),
    ("CS501", 5, 4, 5, 4, "Clear concepts. Good examples on recursion.", "More recursion trees."),
    ("CS502", 2, 2, 3, 2, "Too fast pace. Hard to take notes during lecture.", "Share lecture notes."),
    ("CS503", 4, 4, 4, 4, "Decent teaching. Good practice questions.", "None."),
    ("CS504", 1, 1, 2, 1, "Timepass. Wi-Fi was down during lab test.", "Fix lab network issues."),
    ("CS505", 4, 4, 4, 4, "Strong focus on mathematics. Appreciated.", "More coding."),
    ("CS506", 3, 3, 3, 3, "Average course. Could be more practical.", "More git hands-on."),
    ("CS501", 4, 5, 4, 3, "Algorithms are fun when taught like this.", "Add backtracking topics."),
    ("CS502", 2, 3, 2, 1, "Linux kernel compilation lab was a disaster.", "Fix kernel headers in lab PCs.")
]

# 100 comprehensive, curated FAQs
FAQS_DATA = [
    # Submitting Feedback (1-10)
    ("FAQ-001", "Submitting Feedback", "How do I submit feedback for an enrolled subject?", "Navigate to the 'Submit Feedback' tab from the student dashboard, select your course from the dropdown menu, grade each of the four evaluation criteria from 1 to 5 stars, write your constructive review, and click 'Submit Evaluation'."),
    ("FAQ-002", "Submitting Feedback", "Can I submit feedback multiple times for the same subject?", "The system implements SHA-256 cryptographic duplicate checking to prevent accidental double submissions. However, you can submit fresh feedback during separate evaluation cycles (such as Mid-Term vs. End-Term)."),
    ("FAQ-003", "Submitting Feedback", "What are the four core criteria evaluated in the feedback form?", "The four dimensions are: 1) Overall Satisfaction, 2) Teaching Clarity, 3) Course Content & Syllabus Relevance, and 4) Practical & Laboratory Sessions."),
    ("FAQ-004", "Submitting Feedback", "Is written feedback mandatory when submitting an evaluation?", "Yes. A minimum of 10 characters is required for written feedback to ensure students share substantive context rather than clicking stars blindly."),
    ("FAQ-005", "Submitting Feedback", "Can I edit my feedback after it has been submitted?", "To maintain evaluation integrity and prevent post-hoc tampering, submitted feedback cannot be modified. If an error was made, contact your department academic coordinator."),
    ("FAQ-006", "Submitting Feedback", "What is the optional 'Suggestions' field used for?", "The suggestions field is dedicated to actionable ideas for curriculum enhancement, such as requests for additional practice problem sets, altered lab hours, or supplemental reading materials."),
    ("FAQ-007", "Submitting Feedback", "Can I submit feedback from a mobile device or tablet?", "Yes. The Student Feedback Assistant is fully responsive and optimized for mobile viewports, touchscreen star inputs, and floating bottom action bars."),
    ("FAQ-008", "Submitting Feedback", "What should I do if a subject I am enrolled in does not appear in the dropdown?", "If an active course is missing, your department administrator may not have linked the course code yet. Please notify your academic advisor or administrator."),
    ("FAQ-009", "Submitting Feedback", "Are faculty members notified the moment an evaluation is submitted?", "Faculty members do not receive immediate individual alerts. Feedback is compiled and aggregated periodically to preserve cohort anonymity."),
    ("FAQ-010", "Submitting Feedback", "Is feedback submission tied to mid-term exam clearance?", "At many institutions, completing the CIE feedback cycle is a prerequisite for hall ticket issuance and mid-term grade publication."),

    # Privacy & Access (11-20)
    ("FAQ-011", "Privacy & Access", "How does the Anonymous Submission feature protect my identity?", "When the 'Submit Anonymously' toggle is selected, the database explicitly dissociates your user ID (`user_id = null`). The submission contains no relational link to your student profile, name, or email."),
    ("FAQ-012", "Privacy & Access", "Can faculty members see who submitted negative feedback?", "No. Faculty and administrators view aggregated analytics, sentiment charts, and anonymized comment feeds. Individual identifying details are never revealed."),
    ("FAQ-013", "Privacy & Access", "Can I view my previous submissions if I submitted them anonymously?", "Anonymous submissions cannot be linked back to your student account, so they will not appear in your personal 'My Feedback History' tab."),
    ("FAQ-014", "Privacy & Access", "Are student account passwords stored securely?", "Yes. All passwords are encrypted with salted bcrypt hashing on the backend. Raw passwords are never logged, stored in plaintext, or transmitted across endpoints."),
    ("FAQ-015", "Privacy & Access", "What role-based access levels exist in the application?", "The platform enforces two distinct roles: 'Student' (feedback submission, personal history, AI chat assistant) and 'Admin' (analytics dashboard, CSV exports, knowledge base management, sentiment re-runs)."),
    ("FAQ-016", "Privacy & Access", "Does the AI chatbot expose private student information?", "No. The AI Chatbot is bounded by strict institutional guardrails. It never reveals user passwords, private student identities, or unapproved confidential records."),
    ("FAQ-017", "Privacy & Access", "Can administrators delete individual feedback submissions?", "Administrators have access to aggregate metrics and data management tools for demonstration datasets, but production audit logs prevent arbitrary deletion of authentic feedback."),
    ("FAQ-018", "Privacy & Access", "How are JWT access tokens validated?", "Each request to protected endpoints carries a bearer JWT token verified cryptographically using HMAC-SHA256 and an expiring timestamp."),
    ("FAQ-019", "Privacy & Access", "What happens when an account is marked inactive?", "Inactive accounts receive a 403 Forbidden status upon login attempts and cannot access submission or analytics services."),
    ("FAQ-020", "Privacy & Access", "Does the system track student IP addresses?", "No IP addresses or device fingerprints are attached to the persisted feedback record, preserving anonymity in accordance with educational privacy standards."),

    # Sentiment Analysis (21-30)
    ("FAQ-021", "Sentiment Analysis", "What is sentiment analysis in the context of student feedback?", "Sentiment analysis is a natural language processing technique that classifies textual comments into Positive, Neutral, Negative, or Mixed categories based on linguistic valence."),
    ("FAQ-022", "Sentiment Analysis", "Which model is used by default for sentiment classification?", "The system utilizes an enhanced VADER (Valence Aware Dictionary and sEntiment Reasoner) rule-based engine enriched with a domain-specific Hinglish lexicon."),
    ("FAQ-023", "Sentiment Analysis", "Why is VADER used instead of a massive neural network?", "VADER runs deterministically in real time with zero external API dependencies, provides full mathematical explainability, and performs reliably on local Windows systems without GPU requirements."),
    ("FAQ-024", "Sentiment Analysis", "How does the system handle Hinglish feedback (Hindi written in Roman script)?", "The sentiment engine integrates custom educational Hinglish vocabulary (e.g., 'bohot achha', 'samajh aa gaya', 'bekar', 'bakwas') directly into its valence lexicon."),
    ("FAQ-025", "Sentiment Analysis", "What constitutes a 'Mixed' sentiment classification?", "A comment is classified as Mixed when it contains both strong positive praise and strong negative criticism simultaneously (e.g., 'The theoretical concepts were brilliant, but the lab equipment was completely broken')."),
    ("FAQ-026", "Sentiment Analysis", "What are the compound score thresholds for sentiment polarity?", "VADER compound scores >= +0.15 indicate Positive sentiment; scores <= -0.15 indicate Negative; balanced or weak valence yields Neutral; dual polarity yields Mixed."),
    ("FAQ-027", "Sentiment Analysis", "What is the 'Sentiment Confidence' score?", "Confidence measures the statistical certainty of the valence classification, bounded between 0.40 (borderline/ambiguous) and 0.99 (strongly definitive)."),
    ("FAQ-028", "Sentiment Analysis", "What are academic thematic tags?", "The engine automatically scans comments for domain keywords to tag themes such as `teaching_clarity`, `practical_sessions`, `course_content`, `pace_and_workload`, and `classroom_environment`."),
    ("FAQ-029", "Sentiment Analysis", "Can the administrator re-run sentiment analysis on all existing feedback?", "Yes. The `/api/feedback/rerun-sentiment` endpoint enables administrators to re-evaluate every record whenever new lexicon rules or models are updated."),
    ("FAQ-030", "Sentiment Analysis", "Does sentiment score override a student's numerical star rating?", "No. Sentiment and numerical star ratings are stored independently to allow analytical cross-referencing (e.g., detecting students who give 5 stars but write critical comments)."),

    # Ratings & Meaning (31-40)
    ("FAQ-031", "Ratings & Meaning", "What does a 5-star rating signify?", "A 5-star rating indicates exceptional performance that exceeds syllabus expectations with outstanding pedagogical clarity and interactive engagement."),
    ("FAQ-032", "Ratings & Meaning", "What does a 1-star rating signify?", "A 1-star rating denotes critical deficiency requiring immediate departmental review, such as missed syllabus modules, absent lab support, or inaudible lectures."),
    ("FAQ-033", "Ratings & Meaning", "How is 'Teaching Clarity' defined on the rubric?", "Teaching Clarity evaluates how clearly complex algorithms, derivations, and concepts are explained, structured, and illustrated on the board."),
    ("FAQ-034", "Ratings & Meaning", "How is 'Course Content' evaluated?", "Course Content evaluates syllabus relevance, textbook resources, lecture slide quality, and alignment with modern industry standards."),
    ("FAQ-035", "Ratings & Meaning", "How is 'Practical Sessions' evaluated?", "Practical Sessions measures hands-on experimentation, coding exercises, working lab equipment, and laboratory assistant helpfulness."),
    ("FAQ-036", "Ratings & Meaning", "How is the overall cohort satisfaction index calculated?", "It is the direct mathematical arithmetic mean of all `overall_rating` values across all verified feedback submissions for the cohort."),
    ("FAQ-037", "Ratings & Meaning", "Are rating averages weighted by class attendance?", "In the standard edition, ratings carry equal weight. Attendance-weighted grading is an optional departmental module."),
    ("FAQ-038", "Ratings & Meaning", "Can a student rate different dimensions differently for the same subject?", "Yes. For example, a student may award 5 stars for Teaching Clarity but 2 stars for Practical Sessions if the lab computers were faulty."),
    ("FAQ-039", "Ratings & Meaning", "How are star ratings represented on the admin analytics charts?", "Star ratings are visualized as a 5-bucket distribution histogram showing the percentage and count of students choosing each star level."),
    ("FAQ-040", "Ratings & Meaning", "What is considered a healthy course rating benchmark?", "Institutional guidelines typically consider an overall score of 3.80 or higher out of 5.00 to reflect healthy educational delivery."),

    # Constructive Feedback (41-50)
    ("FAQ-041", "Constructive Feedback", "What makes feedback 'constructive'?", "Constructive feedback provides specific, objective observations paired with actionable suggestions rather than emotional complaints."),
    ("FAQ-042", "Constructive Feedback", "Why are vague comments like 'Good class' or 'Boring' unhelpful?", "Vague comments fail to tell the instructor what worked well or what needs improvement, offering no pathway for instructional change."),
    ("FAQ-043", "Constructive Feedback", "How can I rewrite 'The lectures are too fast' constructively?", "Constructive rewrite: 'The lecture pacing is rapid; pausing for two minutes after introducing major theorems would allow students to digest the concepts.'"),
    ("FAQ-044", "Constructive Feedback", "How can I rewrite 'Lab experiments are useless' constructively?", "Constructive rewrite: 'Adding a 15-minute introductory walkthrough of the lab simulator before each coding session would help us finish exercises on time.'"),
    ("FAQ-045", "Constructive Feedback", "Should constructive feedback mention faculty personality traits?", "No. Feedback should strictly focus on academic delivery, lecture pace, clarity, assignments, and facilities—never on personal attributes."),
    ("FAQ-046", "Constructive Feedback", "Can constructive feedback also include praise?", "Yes! Highlighting what works well (e.g., 'The whiteboard memory layout diagrams really helped') encourages faculty to continue those effective techniques."),
    ("FAQ-047", "Constructive Feedback", "Where can I view more examples of constructive rewrites?", "Check the 'Knowledge Search' tab or ask the AI Assistant: 'How can I write constructive feedback?' to view 20+ real-world examples."),
    ("FAQ-048", "Constructive Feedback", "Does the AI assistant review my comment before I submit it?", "You can ask the AI Assistant to review a draft comment: 'Can you suggest a constructive rewrite for my comment?' before submitting."),
    ("FAQ-049", "Constructive Feedback", "What is the three-part constructive feedback formula?", "The formula is: 1) Specific observation + 2) Concrete learning impact + 3) Actionable recommendation."),
    ("FAQ-050", "Constructive Feedback", "Are constructive suggestions shared during departmental syllabus revisions?", "Yes. Academic boards review the aggregated 'Suggestions' section during annual Board of Studies curriculum review meetings."),

    # RAG & Knowledge Base (51-60)
    ("FAQ-051", "RAG & Knowledge Base", "What does RAG stand for?", "RAG stands for Retrieval-Augmented Generation—a technique that retrieves authoritative documents from a database to ground AI answers in verified facts."),
    ("FAQ-052", "RAG & Knowledge Base", "Why is RAG critical for an institutional assistant?", "RAG prevents the AI from hallucinating or inventing non-existent college rules, faculty names, or feedback numbers by forcing it to cite stored documents."),
    ("FAQ-053", "RAG & Knowledge Base", "What file formats can be uploaded to the Knowledge Base?", "Administrators can upload Markdown (`.md`), Plain Text (`.txt`), Adobe PDF (`.pdf`), and JSON (`.json`) files under 10MB in size."),
    ("FAQ-054", "RAG & Knowledge Base", "How does document chunking work in this system?", "Uploaded documents are parsed, normalized, and partitioned into ~500 character chunks with a 50-character semantic overlap across sentence boundaries."),
    ("FAQ-055", "RAG & Knowledge Base", "How does the vector search retrieve relevant chunks?", "The query is converted into a TF-IDF weighted vector and matched against all stored chunk vectors using cosine similarity scoring."),
    ("FAQ-056", "RAG & Knowledge Base", "What happens when no relevant document matches a student query?", "The system honestly informs the student that no matching records were found, rather than inventing false facts."),
    ("FAQ-057", "RAG & Knowledge Base", "Can administrators delete outdated documents?", "Yes. Deleting a document from the Knowledge Management interface immediately deletes its file and purges all associated vector chunks from the index."),
    ("FAQ-058", "RAG & Knowledge Base", "What is the purpose of the 'Re-index' button?", "Re-indexing re-reads all physical documents from disk, recalculates chunks, and rebuilds the vector index from scratch."),
    ("FAQ-059", "RAG & Knowledge Base", "Where is the vector index stored on disk?", "The vector index is saved locally in `backend/data/vector_store/vector_index.json`."),
    ("FAQ-060", "RAG & Knowledge Base", "How does duplicate document detection work?", "A cryptographic SHA-256 hash of the file bytes is computed upon upload. If an identical hash exists, the upload is rejected with a 409 Conflict."),

    # AI Chatbot & Query Routing (61-70)
    ("FAQ-061", "AI Chatbot", "How does the AI Assistant decide how to answer my question?", "A smart query router inspects your question. Statistical queries run direct database calculations; conceptual questions search RAG documents; general queries receive guided advice."),
    ("FAQ-062", "AI Chatbot", "Can the AI Assistant answer in Hinglish?", "Yes. The assistant recognizes common Hinglish academic questions such as 'DS me sabse common complaint kya hai?' or 'Feedback kaisa likhein?'"),
    ("FAQ-063", "AI Chatbot", "What happens if no Google Gemini API key is configured?", "The assistant seamlessly runs in zero-key offline fallback mode, displaying the top verified passages and citations with clear labels."),
    ("FAQ-064", "AI Chatbot", "How do I start a fresh conversation session?", "Click the 'New Conversation' button at the top of the AI Chat interface to clear the current chat thread and reset session context."),
    ("FAQ-065", "AI Chatbot", "Can I rate the helpfulness of the assistant's responses?", "Yes. Each assistant answer includes Thumbs-Up and Thumbs-Down rating buttons that record student feedback directly into the database."),
    ("FAQ-066", "AI Chatbot", "Does the chatbot retain context across follow-up questions?", "Yes. Multi-turn dialogue context is maintained within the active session so you can ask follow-ups like 'What about Operating Systems?'"),
    ("FAQ-067", "AI Chatbot", "Why does the chatbot display source badges below its answers?", "Source badges show the exact document titles, categories, and relevance scores used to formulate the response, ensuring transparent provenance."),
    ("FAQ-068", "AI Chatbot", "Can I copy an answer from the chatbot?", "Yes. Click the 'Copy' icon on any assistant message card to copy its markdown text directly to your clipboard."),
    ("FAQ-069", "AI Chatbot", "Which Gemini model is supported?", "The application defaults to `gemini-1.5-flash` or `gemini-2.0-flash` for high-speed, cost-free conversational execution."),
    ("FAQ-070", "AI Chatbot", "Can students use the chatbot to view other students' private feedback?", "No. The chatbot has strict safety guardrails that prevent it from surfacing private, non-aggregated feedback entries."),

    # Admin Dashboard & Analytics (71-80)
    ("FAQ-071", "Admin Dashboard", "Who can access the Admin Analytics Dashboard?", "Only authenticated users with the 'admin' role can view the Analytics Dashboard and administrative routes."),
    ("FAQ-072", "Admin Dashboard", "What key performance indicators (KPIs) are displayed?", "KPI cards highlight: Total Submissions, Overall Satisfaction Average, Teaching Clarity Mean, Course Content Mean, and Practical Sessions Mean."),
    ("FAQ-073", "Admin Dashboard", "What filters are available on the dashboard?", "Administrators can filter by Subject ID, Sentiment Polarity (Positive, Neutral, Negative, Mixed), Minimum/Maximum Rating, Date Range, and Demo Data toggle."),
    ("FAQ-074", "Admin Dashboard", "How does the Sentiment Donut Chart work?", "It visually shows the proportion of Positive, Neutral, Negative, and Mixed feedback submitted across the selected filter scope."),
    ("FAQ-075", "Admin Dashboard", "What is the Subject Comparison Bar Chart?", "It compares mean satisfaction scores across all active departments and subjects, instantly identifying top-performing courses and courses needing pedagogical support."),
    ("FAQ-076", "Admin Dashboard", "What is the Feedback Trend Line Chart?", "It plots daily feedback volume and average rating trajectory over time to reveal whether improvements have occurred during the semester."),
    ("FAQ-077", "Admin Dashboard", "How are 'Top Improvement Themes' discovered?", "The system aggregates extracted NLP thematic tags across all Negative and Mixed comments to surface the most frequent student concerns."),
    ("FAQ-078", "Admin Dashboard", "What does the 'Demo Data Active' badge indicate?", "It alerts evaluators and faculty that sample demonstration records are currently included in the aggregated calculations."),
    ("FAQ-079", "Admin Dashboard", "Can demo data be filtered out of the analytics?", "Yes. Toggle the 'Include Demo Records' switch in the filter drawer to view only live, authentic student submissions."),
    ("FAQ-080", "Admin Dashboard", "Where can I view the AI-generated executive summary?", "The top of the Analytics Dashboard includes a grounded executive summary derived purely from computed statistical metrics."),

    # Reports & CSV Export (81-90)
    ("FAQ-081", "Reports & CSV Export", "Can feedback datasets be exported for offline analysis?", "Yes. Administrators can download the entire feedback dataset as a structured CSV spreadsheet via the 'Export CSV' button."),
    ("FAQ-082", "Reports & CSV Export", "What columns are included in the CSV export?", "Columns include Feedback ID, Submission Date, Subject Code, Subject Name, Faculty Name, Ratings (1-5), Sentiment Label, Confidence, Model, Themes, Written Feedback, Suggestions, and Anonymous flag."),
    ("FAQ-083", "Reports & CSV Export", "Can CSV exports be filtered prior to downloading?", "Yes. You can apply subject, sentiment, and demo data filters before generating the CSV export."),
    ("FAQ-084", "Reports & CSV Export", "Can the exported CSV be imported into Excel or SPSS?", "Yes. The CSV is formatted in standard UTF-8 format and opens cleanly in Microsoft Excel, Google Sheets, Python Pandas, and SPSS."),
    ("FAQ-085", "Reports & CSV Export", "Are student names or emails included in the CSV export?", "No. Student emails and user IDs are excluded to preserve institutional privacy compliance."),
    ("FAQ-086", "Reports & CSV Export", "How frequently can reports be exported?", "Exports can be generated on demand at any time with zero rate limits."),
    ("FAQ-087", "Reports & CSV Export", "Is there a limit on how many rows can be exported?", "No. The backend streams CSV records directly from SQLite without memory bloat."),
    ("FAQ-088", "Reports & CSV Export", "What naming convention is used for exported files?", "Files are named `student_feedback_export_YYYYMMDD_HHMMSS.csv` for clean chronological archiving."),
    ("FAQ-089", "Reports & CSV Export", "Can faculty members download their own subject's CSV?", "In the standard deployment, CSV export is restricted to department administrators. Granular faculty self-service exports can be enabled by policy."),
    ("FAQ-090", "Reports & CSV Export", "Does exporting CSV modify the database?", "No. CSV export is a read-only streaming operation that causes zero changes to database records."),

    # System Status & Technical Issues (91-100)
    ("FAQ-091", "Technical & System Status", "How do I check if the backend API is online?", "Visit `http://localhost:8000/api/health` in your browser. It returns JSON detailing database status, sentiment engine, and RAG chunk counts."),
    ("FAQ-092", "Technical & System Status", "Where are the interactive Swagger API documentation docs located?", "Interactive Swagger UI documentation is available at `http://localhost:8000/docs`."),
    ("FAQ-093", "Technical & System Status", "What should I do if the frontend fails to connect to the backend?", "Ensure the FastAPI server is running on port 8000 (`uvicorn app.main:app --reload`) and that `http://localhost:5173` is included in CORS origins."),
    ("FAQ-094", "Technical & System Status", "Where is the SQLite database file located?", "The database is stored at `backend/data/student_assistant.db`."),
    ("FAQ-095", "Technical & System Status", "How do I reset and re-seed the demonstration database?", "Run `python scripts/init_and_seed.py` from the backend directory to re-create all tables, seed subjects, 50 feedback records, and 100 FAQs."),
    ("FAQ-096", "Technical & System Status", "What are the default administrator login credentials?", "The default seed credentials are Email: `admin@institution.edu`, Password: `Admin@123`."),
    ("FAQ-097", "Technical & System Status", "How can I configure a Google Gemini API key?", "Create a `.env` file in the root or `backend/` directory with `LLM_API_KEY=your_key_here` and restart the backend server."),
    ("FAQ-098", "Technical & System Status", "What Python version is required?", "Python 3.10, 3.11, 3.12, or 3.13 is fully supported."),
    ("FAQ-099", "Technical & System Status", "Does the system require any paid cloud subscriptions to run?", "No. All core full-stack features, database operations, sentiment analysis, RAG vector retrieval, and analytics run 100% free locally on your laptop."),
    ("FAQ-100", "Technical & System Status", "Can this project be packaged and demonstrated for college CIE evaluation?", "Yes! The application is specifically designed for college CIE evaluation (20 marks) with structured architecture, automated tests, and comprehensive viva documentation.")
]


def run_init_and_seed():
    print("=" * 60)
    print("Student Feedback Assistant: Database Init & Seed Pipeline")
    print("=" * 60)

    # 1. Initialize Tables
    print("[1/5] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("      Database tables verified/created successfully.")

    db = SessionLocal()
    try:
        # 2. Seed Administrator
        print("[2/5] Seeding default administrator account...")
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL.lower()).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL.lower(),
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_NAME,
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print(f"      Created administrator: {admin.email} (Password: {settings.ADMIN_PASSWORD})")
        else:
            print(f"      Administrator already exists: {admin.email}")

        # Seed Demo Student Account
        student_email = "student@institution.edu"
        student = db.query(User).filter(User.email == student_email).first()
        if not student:
            student = User(
                email=student_email,
                hashed_password=hash_password("Student@123"),
                full_name="Aria Chen",
                role="student",
                is_active=True
            )
            db.add(student)
            db.commit()
            print(f"      Created demo student: {student.email} (Password: Student@123)")

        # 3. Seed Subjects
        print("[3/5] Seeding academic subjects...")
        subject_map = {}
        for s_data in SUBJECTS_DATA:
            sub = db.query(Subject).filter(Subject.code == s_data["code"]).first()
            if not sub:
                sub = Subject(**s_data)
                db.add(sub)
                db.commit()
                db.refresh(sub)
                print(f"      Added subject: {sub.code} - {sub.name}")
            subject_map[sub.code] = sub

        # 4. Seed 50 Demo Feedback Records with Real Sentiment
        print("[4/5] Seeding 50 demo feedback submissions with real sentiment analysis...")
        existing_fb_count = db.query(Feedback).filter(Feedback.is_demo == True).count()
        if existing_fb_count < 40:
            base_date = datetime.now(timezone.utc) - timedelta(days=25)
            added_fb = 0
            for idx, item in enumerate(DEMO_FEEDBACK_DATA):
                sub_code, overall, clarity, content, practicals, written, sugg = item
                sub = subject_map.get(sub_code)
                if not sub:
                    continue

                created_at = base_date + timedelta(days=(idx % 24), hours=(idx % 12))
                hash_input = f"{sub.id}_{written.strip()}_{overall}"
                sub_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

                # Check duplicate
                if db.query(Feedback).filter(Feedback.submission_hash == sub_hash).first():
                    continue

                fb = Feedback(
                    user_id=student.id if (idx % 3 != 0) else None,
                    subject_id=sub.id,
                    overall_rating=overall,
                    teaching_clarity=clarity,
                    course_content=content,
                    practical_sessions=practicals,
                    written_feedback=written,
                    suggestions=sugg,
                    is_anonymous=(idx % 3 == 0),
                    is_demo=True,
                    submission_hash=sub_hash,
                    created_at=created_at
                )
                db.add(fb)
                db.commit()
                db.refresh(fb)

                # Sentiment Analysis
                analysis = sentiment_engine.analyze(written)
                sent = SentimentResult(
                    feedback_id=fb.id,
                    predicted_sentiment=analysis["sentiment"],
                    confidence=analysis["confidence"],
                    model_name=analysis["model_name"],
                    themes=analysis["themes"],
                    analyzed_at=created_at
                )
                db.add(sent)
                db.commit()
                added_fb += 1

            print(f"      Seeded {added_fb} demo feedback entries with VADER sentiment.")
        else:
            print(f"      Demo feedback already populated ({existing_fb_count} records).")

        # 5. Seed 100 FAQs
        print("[5/5] Seeding 100 comprehensive FAQs...")
        added_faqs = 0
        for faq_id, category, q, a in FAQS_DATA:
            existing_faq = db.query(FAQ).filter(FAQ.faq_id == faq_id).first()
            if not existing_faq:
                faq_obj = FAQ(
                    faq_id=faq_id,
                    category=category,
                    question=q,
                    answer=a,
                    is_active=True
                )
                db.add(faq_obj)
                added_faqs += 1
        db.commit()
        print(f"      Added {added_faqs} new FAQs (Total: {db.query(FAQ).count()}).")

        # 6. Auto-Ingest Knowledge Base Documents into RAG Vector Store
        print("[+] Ingesting starter markdown documents into RAG vector store...")
        kb_dir = settings.KNOWLEDGE_BASE_DIR
        md_files = list(kb_dir.glob("*.md"))
        ingested_count = 0
        total_chunks = 0

        for md_file in md_files:
            content_bytes = md_file.read_bytes()
            content_hash = hashlib.sha256(content_bytes).hexdigest()
            doc_title = md_file.stem.replace("_", " ").title()

            doc_record = db.query(KnowledgeDocument).filter(KnowledgeDocument.content_hash == content_hash).first()
            if not doc_record:
                doc_record = KnowledgeDocument(
                    title=doc_title,
                    filename=md_file.name,
                    file_type="md",
                    category="Educational Guidance" if "guidance" in md_file.stem else "Feedback Fundamentals",
                    content_hash=content_hash,
                    chunk_count=0,
                    is_indexed=False,
                    ingestion_status="Pending"
                )
                db.add(doc_record)
                db.commit()
                db.refresh(doc_record)

            chunks_num = rag_service.ingest_document(
                file_path=md_file,
                title=doc_record.title,
                category=doc_record.category,
                document_id=doc_record.id
            )
            doc_record.chunk_count = chunks_num
            doc_record.is_indexed = True
            doc_record.ingestion_status = "Indexed"
            db.commit()
            ingested_count += 1
            total_chunks += chunks_num
            print(f"      Indexed '{doc_title}': {chunks_num} chunks")

        print("=" * 60)
        print(f"SUCCESS: System initialized with {db.query(Subject).count()} subjects, "
              f"{db.query(Feedback).count()} feedback entries, "
              f"{db.query(FAQ).count()} FAQs, and {total_chunks} vector chunks in RAG index.")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    run_init_and_seed()
