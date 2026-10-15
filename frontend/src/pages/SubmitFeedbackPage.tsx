import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Star, Send, ShieldCheck, CheckCircle2, AlertCircle, Sparkles,
  Info, ArrowLeft, RefreshCw, MessageSquare
} from 'lucide-react';
import { feedbackApi } from '../services/api';
import type { Subject, FeedbackSubmission } from '../types';

export const SubmitFeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  
  // 4 Core Ratings (1 to 5)
  const [overallRating, setOverallRating] = useState(5);
  const [teachingClarity, setTeachingClarity] = useState(5);
  const [courseContent, setCourseContent] = useState(4);
  const [practicalSessions, setPracticalSessions] = useState(4);

  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<FeedbackSubmission | null>(null);

  useEffect(() => {
    feedbackApi.getSubjects().then((data) => {
      setSubjects(data);
      const urlSubId = searchParams.get('subject_id');
      if (urlSubId) {
        setSelectedSubjectId(parseInt(urlSubId, 10));
      } else if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    });
  }, [searchParams]);

  const selectedSubject = subjects.find((s) => s.id === Number(selectedSubjectId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setError('Please select a course to evaluate.');
      return;
    }
    if (writtenFeedback.trim().length < 10) {
      setError('Please provide at least 10 characters of constructive written feedback.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await feedbackApi.submitFeedback({
        subject_id: Number(selectedSubjectId),
        overall_rating: overallRating,
        teaching_clarity: teachingClarity,
        course_content: courseContent,
        practical_sessions: practicalSessions,
        written_feedback: writtenFeedback.trim(),
        suggestions: suggestions.trim() || undefined,
        is_anonymous: isAnonymous
      });
      setSuccessResult(res);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to submit evaluation. Please check inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStarSelector = (
    label: string,
    description: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-2">
      <div>
        <div className="text-xs font-bold text-slate-800">{label}</div>
        <div className="text-[11px] text-slate-500">{description}</div>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1.5 rounded-lg transition-all ${
              star <= value
                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 scale-105'
                : 'text-slate-300 hover:text-slate-400'
            }`}
          >
            <Star className={`w-5 h-5 ${star <= value ? 'fill-amber-400' : ''}`} />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-700 ml-1.5 w-7 text-right">
          {value}/5
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Portal</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Course Evaluation Rubric
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submit your candid feedback across pedagogical clarity, course material, and hands-on laboratory sessions.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            Spring 2026 CIE
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <div>
              <div className="font-bold">Submission Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* 1. Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Enrolled Subject *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
            >
              <option value="" disabled>-- Select Course --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.faculty_name})
                </option>
              ))}
            </select>
            {selectedSubject && (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-700">Lead Faculty:</span>
                <span>{selectedSubject.faculty_name}</span>
                <span>•</span>
                <span>{selectedSubject.department}</span>
              </div>
            )}
          </div>

          {/* 2. Rating Dimensions */}
          <div className="flex flex-col gap-3">
            <label className="block text-xs font-bold text-slate-800">
              Evaluation Criteria (1 to 5 Stars) *
            </label>
            {renderStarSelector(
              'Overall Satisfaction',
              'Holistic rating of course execution and academic value',
              overallRating,
              setOverallRating
            )}
            {renderStarSelector(
              'Teaching Clarity',
              'Clarity of concept explanation, board work, and pacing',
              teachingClarity,
              setTeachingClarity
            )}
            {renderStarSelector(
              'Course Content & Syllabus',
              'Quality of notes, curriculum rigor, and textbook references',
              courseContent,
              setCourseContent
            )}
            {renderStarSelector(
              'Practical & Laboratory Sessions',
              'Hands-on coding, equipment access, and lab assistant support',
              practicalSessions,
              setPracticalSessions
            )}
          </div>

          {/* 3. Written Qualitative Feedback */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Constructive Qualitative Review *
              </label>
              <span className={`text-[11px] font-semibold ${
                writtenFeedback.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {writtenFeedback.length} / 2000 chars (min 10)
              </span>
            </div>
            <textarea
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              placeholder="Detail specific lecture topics, what was explained clearly, or areas that caused confusion. Hinglish is supported (e.g., 'Samajh aa gaya, lab session achha tha')."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Focus on specific academic delivery techniques and learning outcomes.
            </p>
          </div>

          {/* 4. Actionable Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Actionable Improvement Suggestions (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="e.g. 'Solve two sample numerical problems on the board before weekly assignments.'"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* 5. Anonymity Toggle */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="anonymous-toggle"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="anonymous-toggle" className="cursor-pointer">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Submit as Anonymous Feedback</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                When enabled, the database completely detaches your user identity (<code className="bg-white px-1 py-0.5 rounded text-[10px]">user_id = null</code>). The feedback cannot be traced back to your student account or email.
              </p>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Analyzing & Persisting Feedback...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Course Evaluation</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Real-Time Sentiment Preview Modal upon Success */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col gap-5 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Evaluation Submitted & Analyzed!</h3>
                <p className="text-xs text-slate-500">Persisted with real-time NLP sentiment tagging</p>
              </div>
            </div>

            {/* Sentiment Telemetry Card */}
            {successResult.sentiment && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Automated NLP Classification</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    successResult.sentiment.predicted_sentiment === 'Positive'
                      ? 'bg-emerald-100 text-emerald-800'
                      : successResult.sentiment.predicted_sentiment === 'Negative'
                      ? 'bg-red-100 text-red-800'
                      : successResult.sentiment.predicted_sentiment === 'Mixed'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {successResult.sentiment.predicted_sentiment} Sentiment
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Model Used:</span>
                    <div className="font-semibold text-slate-700">{successResult.sentiment.model_name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Confidence Metric:</span>
                    <div className="font-semibold text-slate-700">
                      {Math.round(successResult.sentiment.confidence * 100)}% Certainty
                    </div>
                  </div>
                </div>

                {successResult.sentiment.themes && (
                  <div className="pt-2 border-t border-slate-200/70 text-xs">
                    <span className="text-slate-400">Detected Themes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {JSON.parse(successResult.sentiment.themes || '[]').map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => {
                  setSuccessResult(null);
                  setWrittenFeedback('');
                  setSuggestions('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Submit Another
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
