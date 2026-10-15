import React, { useEffect, useState } from 'react';
import {
  BookOpen, Upload, Trash2, RefreshCw, Plus, Search,
  CheckCircle, AlertCircle, FileText, HelpCircle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { knowledgeApi } from '../services/api';
import type { KnowledgeDocument, FAQ } from '../types';

export const KnowledgeManagementPage: React.FC = () => {
  const { role, switchRoleDemo } = useAuth();

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Educational Guidance');
  const [uploading, setUploading] = useState(false);

  // Add FAQ Modal State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqId, setFaqId] = useState('');
  const [faqCat, setFaqCat] = useState('Submitting Feedback');
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, fList] = await Promise.all([
        knowledgeApi.getDocuments(),
        knowledgeApi.getFAQs()
      ]);
      setDocuments(docs);
      setFaqs(fList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      loadData();
    }
  }, [role]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setUploading(true);
    try {
      await knowledgeApi.uploadDocument(uploadFile, uploadTitle.trim(), uploadCategory);
      setToastMessage('Document uploaded, parsed, and chunked into RAG vector store successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Document upload failed.');
    } finally {
      setUploading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document and remove its vector chunks?')) return;
    try {
      await knowledgeApi.deleteDocument(docId);
      setToastMessage('Document deleted and chunks purged from RAG index.');
      loadData();
    } catch {
      alert('Failed to delete document.');
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await knowledgeApi.reindexAll();
      setToastMessage(res.message);
      loadData();
    } catch {
      alert('Re-indexing failed.');
    } finally {
      setReindexing(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqId || !faqQ || !faqA) return;
    try {
      await knowledgeApi.createFAQ({
        faq_id: faqId,
        category: faqCat,
        question: faqQ,
        answer: faqA,
        is_active: true
      });
      setShowFaqModal(false);
      setFaqId('');
      setFaqQ('');
      setFaqA('');
      setToastMessage('FAQ added successfully!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add FAQ.');
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm(`Delete FAQ ${id}?`)) return;
    try {
      await knowledgeApi.deleteFAQ(id);
      loadData();
    } catch {
      alert('Failed to delete FAQ.');
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Admin Privileges Required</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
            RAG document ingestion, chunking, and FAQ curation interfaces are protected for departmental evaluators and chairs.
          </p>
          <button
            onClick={() => switchRoleDemo('admin')}
            className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Switch to Administrator Session (Demo Viva)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            <span>Knowledge Base & RAG Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload institutional guidance files (.md, .txt, .pdf, .json), manage RAG vector chunks, and curate FAQs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Rebuild TF-IDF vector index from disk"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Re-indexing...' : 'Re-index Vector Store'}</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Indexed Documents Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Indexed Knowledge Documents</h2>
            <p className="text-xs text-slate-500">Files parsed into ~500 character chunks with cosine similarity vectors</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {documents.length} Documents Active
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading documents...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Vector Chunks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{doc.title}</td>
                    <td className="py-3 px-4 text-slate-600">{doc.category}</td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 uppercase text-[10px] font-bold">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{doc.chunk_count} chunks</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.ingestion_status === 'Indexed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {doc.ingestion_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document & Chunks"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* FAQ Management Section */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Curated Institutional FAQs</h2>
            <p className="text-xs text-slate-500">Comprehensive questions mapped for instant conversational answering</p>
          </div>
          <button
            onClick={() => setShowFaqModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
          {faqs.slice(0, 25).map((f) => (
            <div key={f.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                    {f.faq_id}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{f.category}</span>
                </div>
                <h4 className="font-bold text-slate-900">{f.question}</h4>
                <p className="text-slate-600 leading-relaxed line-clamp-2">{f.answer}</p>
              </div>
              <button
                onClick={() => handleDeleteFaq(f.faq_id)}
                className="p-1 text-slate-400 hover:text-red-600 rounded shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-center text-xs text-slate-400">
          Showing 25 of {faqs.length} FAQs in directory
        </div>
      </section>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Knowledge Document</h3>
            <p className="text-xs text-slate-500 mb-5">Supported formats: Markdown (.md), Plain Text (.txt), PDF (.pdf), JSON (.json)</p>

            <form onSubmit={handleUpload} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Lab Safety & Evaluation Guidelines"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm"
                >
                  <option value="Educational Guidance">Educational Guidance</option>
                  <option value="Feedback Fundamentals">Feedback Fundamentals</option>
                  <option value="Sentiment Analysis">Sentiment Analysis</option>
                  <option value="Lab Protocols">Lab Protocols</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select File (&lt;10MB) *</label>
                <input
                  type="file"
                  required
                  accept=".md,.txt,.pdf,.json"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Ingesting...' : 'Ingest & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Frequently Asked Question</h3>
            <p className="text-xs text-slate-500 mb-5">Added questions will be indexed for the AI chatbot and directory</p>

            <form onSubmit={handleAddFaq} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">FAQ Identifier *</label>
                <input
                  type="text"
                  required
                  value={faqId}
                  onChange={(e) => setFaqId(e.target.value)}
                  placeholder="e.g. FAQ-101"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={faqCat}
                  onChange={(e) => setFaqCat(e.target.value)}
                  placeholder="e.g. Submitting Feedback"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Text *</label>
                <input
                  type="text"
                  required
                  value={faqQ}
                  onChange={(e) => setFaqQ(e.target.value)}
                  placeholder="What is..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Authoritative Answer *</label>
                <textarea
                  rows={3}
                  required
                  value={faqA}
                  onChange={(e) => setFaqA(e.target.value)}
                  placeholder="The system..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
