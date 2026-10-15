import axios from 'axios';
import type {
  AuthResponse, User, Subject, FeedbackSubmission, FeedbackCreateInput,
  AnalyticsOverview, KnowledgeDocument, FAQ, ChatMessageItem, SystemHealth
} from '../types';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Don't auto-clear if we are actively attempting to login
      if (!err.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, fullName: string, role = 'student'): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      role
    });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const feedbackApi = {
  getSubjects: async (): Promise<Subject[]> => {
    const res = await api.get('/feedback/subjects');
    return res.data;
  },
  createSubject: async (data: Omit<Subject, 'id'>): Promise<Subject> => {
    const res = await api.post('/feedback/subjects', data);
    return res.data;
  },
  submitFeedback: async (data: FeedbackCreateInput): Promise<FeedbackSubmission> => {
    const res = await api.post('/feedback/submit', data);
    return res.data;
  },
  getMyHistory: async (): Promise<FeedbackSubmission[]> => {
    const res = await api.get('/feedback/history');
    return res.data;
  },
  rerunSentiment: async (): Promise<{ message: string; count: number }> => {
    const res = await api.post('/feedback/rerun-sentiment');
    return res.data;
  }
};

export const analyticsApi = {
  getOverview: async (params?: {
    subject_id?: number;
    sentiment?: string;
    min_rating?: number;
    max_rating?: number;
    include_demo?: boolean;
  }): Promise<AnalyticsOverview> => {
    const res = await api.get('/analytics/overview', { params });
    return res.data;
  },
  getExportUrl: (params?: { subject_id?: number; sentiment?: string; include_demo?: boolean }) => {
    const url = new URL(`${API_BASE}/analytics/export-csv`);
    if (params?.subject_id) url.searchParams.set('subject_id', params.subject_id.toString());
    if (params?.sentiment) url.searchParams.set('sentiment', params.sentiment);
    if (params?.include_demo !== undefined) url.searchParams.set('include_demo', params.include_demo.toString());
    return url.toString();
  }
};

export const knowledgeApi = {
  getDocuments: async (): Promise<KnowledgeDocument[]> => {
    const res = await api.get('/knowledge/documents');
    return res.data;
  },
  uploadDocument: async (file: File, title: string, category: string): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    const res = await api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  deleteDocument: async (docId: number): Promise<{ message: string }> => {
    const res = await api.delete(`/knowledge/documents/${docId}`);
    return res.data;
  },
  reindexAll: async (): Promise<{ message: string; documents_count: number; chunks_count: number }> => {
    const res = await api.post('/knowledge/reindex');
    return res.data;
  },
  getFAQs: async (category?: string): Promise<FAQ[]> => {
    const res = await api.get('/knowledge/faqs', { params: { category } });
    return res.data;
  },
  createFAQ: async (data: Omit<FAQ, 'id' | 'created_at'>): Promise<FAQ> => {
    const res = await api.post('/knowledge/faqs', data);
    return res.data;
  },
  updateFAQ: async (faqId: string, data: Partial<FAQ>): Promise<FAQ> => {
    const res = await api.put(`/knowledge/faqs/${faqId}`, data);
    return res.data;
  },
  deleteFAQ: async (faqId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/knowledge/faqs/${faqId}`);
    return res.data;
  },
  search: async (query: string, topK = 6): Promise<{ query: string; results: any[]; total_found: number }> => {
    const res = await api.get('/knowledge/search', { params: { q: query, top_k: topK } });
    return res.data;
  }
};

export const chatApi = {
  query: async (message: string, sessionId?: string, subjectId?: number): Promise<ChatMessageItem> => {
    const res = await api.post('/chat/query', {
      message,
      session_id: sessionId,
      subject_id: subjectId
    });
    return {
      role: 'assistant',
      content: res.data.response,
      query_type: res.data.query_type,
      sources: res.data.sources,
      is_fallback: res.data.is_fallback,
      provider_used: res.data.provider_used,
      timestamp: res.data.timestamp
    };
  },
  rateMessage: async (messageId: number, isHelpful: boolean): Promise<void> => {
    await api.post('/chat/rate', { message_id: messageId, is_helpful: isHelpful });
  },
  getHistory: async (sessionId: string) => {
    const res = await api.get(`/chat/history/${sessionId}`);
    return res.data;
  }
};

export const systemApi = {
  getHealth: async (): Promise<SystemHealth> => {
    const res = await api.get('/health');
    return res.data;
  }
};

export default api;
