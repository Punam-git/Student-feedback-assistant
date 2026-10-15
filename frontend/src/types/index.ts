export type UserRole = 'student' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: number;
  faculty_name: string;
}

export interface SentimentResult {
  id: number;
  predicted_sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  confidence: number;
  model_name: string;
  themes?: string;
  analyzed_at: string;
}

export interface FeedbackSubmission {
  id: number;
  subject_id: number;
  subject_code?: string;
  subject_name?: string;
  faculty_name?: string;
  overall_rating: number;
  teaching_clarity: number;
  course_content: number;
  practical_sessions: number;
  written_feedback: string;
  suggestions?: string;
  is_anonymous: boolean;
  is_demo: boolean;
  created_at: string;
  sentiment?: SentimentResult;
}

export interface FeedbackCreateInput {
  subject_id: number;
  overall_rating: number;
  teaching_clarity: number;
  course_content: number;
  practical_sessions: number;
  written_feedback: string;
  suggestions?: string;
  is_anonymous: boolean;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
  total: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
  mixed_percentage: number;
}

export interface RatingDistribution {
  stars_1: number;
  stars_2: number;
  stars_3: number;
  stars_4: number;
  stars_5: number;
  total: number;
}

export interface SubjectRatingStat {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  faculty_name: string;
  feedback_count: number;
  avg_overall: number;
  avg_teaching_clarity: number;
  avg_course_content: number;
  avg_practical_sessions: number;
  positive_ratio: number;
}

export interface ThemeCount {
  theme: string;
  count: number;
  sentiment: 'improvement' | 'positive';
}

export interface TrendPoint {
  date: string;
  avg_rating: number;
  count: number;
  positive_count: number;
  negative_count: number;
}

export interface AnalyticsOverview {
  total_feedback: number;
  avg_overall_rating: number;
  avg_teaching_clarity: number;
  avg_course_content: number;
  avg_practical_sessions: number;
  sentiment_distribution: SentimentDistribution;
  rating_distribution: RatingDistribution;
  subject_stats: SubjectRatingStat[];
  top_improvement_themes: ThemeCount[];
  top_positive_highlights: ThemeCount[];
  trends: TrendPoint[];
  is_demo_active: boolean;
  date_range_start?: string;
  date_range_end?: string;
  ai_grounded_summary?: string;
}

export interface KnowledgeDocument {
  id: number;
  title: string;
  filename: string;
  file_type: string;
  category: string;
  chunk_count: number;
  is_indexed: boolean;
  ingestion_status: string;
  error_message?: string;
  uploaded_at: string;
}

export interface FAQ {
  id: number;
  faq_id: string;
  category: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
}

export interface SourceCitation {
  source_title: string;
  category: string;
  content_snippet: string;
  relevance_score?: number;
  page?: number;
}

export interface ChatMessageItem {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  query_type?: string;
  sources?: SourceCitation[];
  is_fallback?: boolean;
  provider_used?: string;
  is_helpful?: boolean;
  timestamp?: string;
}

export interface SystemHealth {
  status: string;
  project: string;
  version: string;
  database: string;
  sentiment_engine: string;
  llm_provider: string;
  llm_status: string;
  indexed_vector_chunks: number;
}
