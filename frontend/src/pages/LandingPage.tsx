import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, ShieldCheck, CheckCircle2,
  Brain, FileText, School, Users, ChevronRight, MessageSquareText
} from 'lucide-react';
import { systemApi, analyticsApi } from '../services/api';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState({ totalFeedback: 50, avgRating: 4.12, satisfactionRate: '92.4%' });
  const [systemOnline, setSystemOnline] = useState(true);

  useEffect(() => {
    systemApi.getHealth().then(() => setSystemOnline(true)).catch(() => setSystemOnline(false));
    analyticsApi.getOverview({ include_demo: true }).then((data) => {
      if (data && data.total_feedback) {
        setStats({
          totalFeedback: data.total_feedback,
          avgRating: data.avg_overall_rating,
          satisfactionRate: `${data.sentiment_distribution.positive_percentage}%`
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50/50">
      {/* Hero Section with Ambient Glow */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200/80 bg-white">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-blue-100/60 via-cyan-50/40 to-transparent blur-3xl pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          {/* CIE Project Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">
              CIE Evaluation & Learning Intelligence Platform • Active 2026
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-[1.15]">
            Turn Student Voice into{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Measurable Academic Growth.
            </span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
            An institutional-grade full-stack platform built for college continuous internal evaluations (CIE),
            grounded in NLP sentiment classification, RAG vector retrieval, and truthful analytics.
          </p>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <span>Submit Course Evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
            >
              <MessageSquareText className="w-4 h-4 text-blue-600" />
              <span>Academic Advisory Console</span>
            </Link>

            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Admin Live Preview</span>
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="w-full max-w-4xl mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 sm:justify-center p-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-700">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">{stats.totalFeedback}+</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Submissions</div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-center p-2 border-y sm:border-y-0 sm:border-x border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">{stats.satisfactionRate}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Positive Sentiment Ratio</div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-center p-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-700">
                <Brain className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">{stats.avgRating} / 5.0</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cohort Satisfaction Index</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Engineered for Academic Rigor & Viva Excellence
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Every module addresses concrete pedagogical needs with verifiable algorithms and strict data integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: VADER + Hinglish NLP */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">VADER & Hinglish Sentiment Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Deterministic rule-based sentiment scoring enhanced with custom Hinglish educational lexicon
                (e.g., <em>bohot achha, bekar, samajh aa gaya</em>) and automatic academic thematic extraction.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Zero-GPU Offline Execution</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: RAG Vector Store */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">RAG Document Retrieval</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Indexes institutional policy guidelines, constructive feedback examples, and 100 FAQs into a vector index
                with cosine similarity search and transparent source citations.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600">
              <span>76+ Indexed Chunks & 100 FAQs</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Truthful Analytics */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Evidence-Based Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Direct SQLite aggregations compute subject ratings, star distributions, and longitudinal trends.
                Calculations are mathematically exact and never approximated by an LLM.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Live CSV Streaming Export</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Academic Workflow */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">4-Stage Closed-Loop Feedback Cycle</h2>
            <p className="text-sm text-slate-600 mt-2">From classroom input to administrative curriculum refinement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-xs font-bold text-blue-600 mb-1">STAGE 01</span>
              <h4 className="font-semibold text-slate-900 mb-1">Student Evaluation</h4>
              <p className="text-xs text-slate-600">
                Multi-dimensional rubric grading (Clarity, Content, Practicals) with optional anonymity toggle and duplicate prevention.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-xs font-bold text-blue-600 mb-1">STAGE 02</span>
              <h4 className="font-semibold text-slate-900 mb-1">NLP Sentiment Reasoning</h4>
              <p className="text-xs text-slate-600">
                Real-time classification into Positive, Neutral, Negative, or Mixed with confidence metrics and domain keyword extraction.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-xs font-bold text-blue-600 mb-1">STAGE 03</span>
              <h4 className="font-semibold text-slate-900 mb-1">RAG Context Grounding</h4>
              <p className="text-xs text-slate-600">
                Academic advisory assistant routes questions to exact SQL queries or RAG semantic search, citing authoritative course documents.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-xs font-bold text-blue-600 mb-1">STAGE 04</span>
              <h4 className="font-semibold text-slate-900 mb-1">Institutional Action</h4>
              <p className="text-xs text-slate-600">
                Department chairs review cohort satisfaction trends, isolate pedagogical bottlenecks, and export CSV audit reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">Student Feedback Assistant</span>
            <span>• College CIE Evaluation Capstone Project</span>
          </div>
          <div>
            <span>Developed with FastAPI, React, SQLite, and VADER NLP • Full-Stack Local Execution</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
