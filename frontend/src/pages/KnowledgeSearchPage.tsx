import React, { useState, useEffect } from 'react';
import {
  Search, BookOpen, HelpCircle, ChevronRight, FileText,
  Filter, Sparkles, ExternalLink
} from 'lucide-react';
import { knowledgeApi } from '../services/api';
import type { FAQ } from '../types';

export const KnowledgeSearchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'faqs'>('search');
  const [searchQuery, setSearchQuery] = useState('constructive feedback');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqCategory, setFaqCategory] = useState<string>('All');

  useEffect(() => {
    // Initial search
    handleSearch('constructive feedback');
    // Load FAQs
    knowledgeApi.getFAQs().then(setFaqs).catch(() => []);
  }, []);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await knowledgeApi.search(q, 8);
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const faqCategories = ['All', ...new Set(faqs.map((f) => f.category))];
  const filteredFaqs = faqCategory === 'All'
    ? faqs
    : faqs.filter((f) => f.category === faqCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Institutional Knowledge & Guidance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search verified pedagogical frameworks, constructive feedback guides, and 100 comprehensive FAQs.
          </p>
        </div>

        {/* Tab switch */}
        <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'search' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>RAG Vector Search</span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'faqs' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>100 FAQs Directory</span>
          </button>
        </div>
      </div>

      {activeTab === 'search' ? (
        <div className="flex flex-col gap-6">
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-xs focus-within:ring-2 focus-within:ring-blue-600"
          >
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts (e.g. 'how to write constructive feedback', 'rating scale interpretation', 'sentiment analysis')..."
              className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results Grid */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Found {searchResults.length} relevant excerpts from indexed documents</span>
              <span className="font-semibold text-blue-600">Pure-Python TF-IDF & Cosine Similarity</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Scanning vector store...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                No matching passages found. Try a different query term or browse the FAQs tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {r.category}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          Match: {Math.round(r.similarity_score * 100)}%
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">{r.document_title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-6">
                        {r.chunk_text}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Verified Document Passage</span>
                      {r.page_number && <span>Page {r.page_number}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FAQs Directory Tab */
        <div className="flex flex-col gap-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {faqCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFaqCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  faqCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Showing {filteredFaqs.length} of {faqs.length} Frequently Asked Questions
          </div>

          {/* FAQs Accordion Cards */}
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {faq.faq_id} • {faq.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
