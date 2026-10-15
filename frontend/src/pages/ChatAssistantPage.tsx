import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Send, ThumbsUp, ThumbsDown, Copy, Check,
  RotateCcw, BookOpen, Database, ShieldCheck, FileText,
  ChevronRight, Award, MessageSquare, Compass, BarChart2
} from 'lucide-react';
import { chatApi, systemApi } from '../services/api';
import type { ChatMessageItem } from '../types';

const renderFormattedContent = (content: string, isUser: boolean) => {
  if (isUser) return <span>{content}</span>;

  const lines = content.split('\n');
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lIdx} className="text-sm font-bold text-slate-900 mt-2 mb-0.5 border-b border-slate-200/60 pb-1">
              {trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lIdx} className="text-base font-bold text-slate-900 mt-2 mb-1">
              {trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('- ')) {
          const parts = trimmed.substring(2).split('**');
          return (
            <div key={lIdx} className="flex items-start gap-2 ml-1 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <span>
                {parts.map((p, pIdx) =>
                  pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-slate-900">{p}</strong> : p
                )}
              </span>
            </div>
          );
        }
        const parts = trimmed.split('**');
        return (
          <p key={lIdx} className="text-xs sm:text-sm leading-relaxed">
            {parts.map((p, pIdx) =>
              pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-slate-900">{p}</strong> : p
            )}
          </p>
        );
      })}
    </div>
  );
};

export const ChatAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'assistant',
      content:
        'Welcome to the **Academic Advisory & Evaluation Assistant**.\n\nI can assist you with:\n- **Course Performance Queries**: Query verified student satisfaction ratings, clarity scores, and sentiment metrics computed directly from our database.\n- **Constructive Feedback Coaching**: Guidance on converting vague criticism into actionable, professional curriculum recommendations.\n- **Rubric Interpretation**: Clear definitions of the 4 evaluation criteria (Teaching Clarity, Course Content, Practicals, and Overall).\n\nSelect a topic from the left panel or type your inquiry below.',
      provider_used: 'local-rag',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Date.now()}`);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'stats' | 'rubric' | 'feedback'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessageItem = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatApi.query(text, sessionId);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'The advisory service encountered an error communicating with the institutional intelligence engine. Please verify that the backend API is online.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRate = async (messageId: number | undefined, isHelpful: boolean, idx: number) => {
    if (messageId) {
      await chatApi.rateMessage(messageId, isHelpful);
    }
    setMessages((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, is_helpful: isHelpful } : m))
    );
  };

  const handleNewSession = () => {
    setSessionId(`sess_${Date.now()}`);
    setMessages([
      {
        role: 'assistant',
        content: 'New consultation session initiated. What academic topic or evaluation question would you like to explore?',
        provider_used: 'local-rag',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const advisoryPrompts = [
    {
      cat: 'stats',
      label: 'Operating Systems Rating Breakdown',
      query: 'What is the average rating for Operating Systems?'
    },
    {
      cat: 'stats',
      label: 'Institutional Feedback Overview',
      query: 'Summarize institutional feedback trends'
    },
    {
      cat: 'feedback',
      label: 'How to Write Constructive Feedback',
      query: 'How can I write constructive feedback?'
    },
    {
      cat: 'feedback',
      label: 'Sentiment Analysis Explanation',
      query: 'What is sentiment analysis in this application?'
    },
    {
      cat: 'rubric',
      label: 'Practical Sessions Evaluation Rubric',
      query: 'What are the common concerns about practical sessions?'
    },
    {
      cat: 'rubric',
      label: 'Teaching Clarity Rubric Definition',
      query: 'How is Teaching Clarity evaluated on the rubric?'
    }
  ];

  const filteredPrompts = activeCategory === 'all'
    ? advisoryPrompts
    : advisoryPrompts.filter((p) => p.cat === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Academic Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Academic Advisory & Evaluation Assistant
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                Verified Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Department of Computer Science • Continuous Internal Evaluation (CIE) Advisory Service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Database & Document Grounding</span>
          </div>

          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            title="Reset active consultation session"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Consultation</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: 2 Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left Column: Advisory Navigator & Query Library */}
        <div className="hidden lg:flex lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Advisory Scope
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Curated Inquiries & Consultations
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an institutional topic to query live database metrics or official guidelines:
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all ${
                  activeCategory === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory('stats')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all ${
                  activeCategory === 'stats' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ratings
              </button>
              <button
                onClick={() => setActiveCategory('feedback')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all ${
                  activeCategory === 'feedback' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Feedback
              </button>
              <button
                onClick={() => setActiveCategory('rubric')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all ${
                  activeCategory === 'rubric' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rubrics
              </button>
            </div>

            {/* Inquiries List */}
            <div className="flex flex-col gap-2">
              {filteredPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p.query)}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs group flex items-start justify-between gap-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {p.label}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1 italic">
                      "{p.query}"
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Institutional Trust Card */}
          <div className="mt-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex flex-col gap-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Verifiable Provenance</span>
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Course ratings are calculated dynamically via database queries. Policy details cite verified course documentation.
            </p>
          </div>
        </div>

        {/* Right Column: Conversational Dialogue Stream */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    'U'
                  ) : (
                    <GraduationCap className="w-4 h-4 text-blue-300" />
                  )}
                </div>

                {/* Message Body */}
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-50/80 border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {renderFormattedContent(msg.content, msg.role === 'user')}
                  </div>

                  {/* Assistant Citations & Actions */}
                  {msg.role === 'assistant' && (
                    <div className="flex flex-col gap-2 pt-1">
                      {/* Document Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Retrieved Document References ({msg.sources.length}):</span>
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.sources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 flex flex-col gap-0.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-800 truncate">{src.source_title}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                                    {src.category}
                                  </span>
                                </div>
                                <span className="text-slate-500 italic mt-0.5">"{src.content_snippet}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar (Copy + Feedback) */}
                      <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(msg.content, idx)}
                            className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                            title="Copy advisory memo"
                          >
                            {copiedIdx === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>

                          <div className="h-3 w-px bg-slate-200" />

                          <button
                            onClick={() => handleRate(msg.id, true, idx)}
                            className={`p-1 hover:text-emerald-600 transition-colors ${
                              msg.is_helpful === true ? 'text-emerald-600 font-bold' : ''
                            }`}
                            title="Mark as helpful advisory response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRate(msg.id, false, idx)}
                            className={`p-1 hover:text-red-600 transition-colors ${
                              msg.is_helpful === false ? 'text-red-600 font-bold' : ''
                            }`}
                            title="Mark as unhelpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          {msg.query_type === 'statistics' && (
                            <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                              <Database className="w-3 h-3" /> SQL Arithmetic
                            </span>
                          )}
                          {msg.query_type === 'knowledge' && (
                            <span className="flex items-center gap-1 text-blue-700 font-semibold">
                              <BookOpen className="w-3 h-3" /> Document RAG
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-2 bg-slate-50 p-3 rounded-xl border border-slate-200 w-fit">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Consulting institutional repository and computing database metrics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Mobile Inquiries Strip */}
          <div className="lg:hidden px-4 py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {advisoryPrompts.slice(0, 4).map((p, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(p.query)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs shrink-0 hover:bg-blue-50 font-medium"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Dock Bar */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white transition-all shadow-xs"
            >
              <input
                id="chat-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask an academic question, query course statistics, or request feedback advice..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none"
              />
              <button
                id="chat-submit-btn"
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <span>Consult</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-2 text-center text-[10px] text-slate-400">
              Evaluations and guidance are strictly grounded in institutional knowledge documents and SQLite database records.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
