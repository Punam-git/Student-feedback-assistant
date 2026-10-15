import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Star, ArrowRight, ShieldCheck, CheckCircle2,
  Calendar, MessageSquare, AlertCircle
} from 'lucide-react';
import { feedbackApi } from '../services/api';
import type { FeedbackSubmission } from '../types';

export const FeedbackHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackApi.getMyHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>My Feedback History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Archive of non-anonymous course evaluations submitted from your authenticated account.
          </p>
        </div>
        <Link
          to="/submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Submit New Evaluation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading feedback history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Submissions Recorded Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            You haven't submitted any non-anonymous evaluations in the active evaluation cycle.
            (Note: Anonymous submissions are dissociated from your account by design).
          </p>
          <Link
            to="/submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Submit an Evaluation Now
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {history.map((fb) => (
            <div
              key={fb.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                    {fb.subject_code}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{fb.subject_name}</h3>
                    <span className="text-xs text-slate-500">{fb.faculty_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  {fb.sentiment && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      fb.sentiment.predicted_sentiment === 'Positive'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : fb.sentiment.predicted_sentiment === 'Negative'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : fb.sentiment.predicted_sentiment === 'Mixed'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}>
                      {fb.sentiment.predicted_sentiment}
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Star Ratings Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Overall:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{fb.overall_rating} / 5</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Clarity:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{fb.teaching_clarity} / 5</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Content:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{fb.course_content} / 5</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Practicals:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{fb.practical_sessions} / 5</span>
                  </div>
                </div>
              </div>

              {/* Comments Text */}
              <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">Written Review:</span>
                <p className="whitespace-pre-line">{fb.written_feedback}</p>
                {fb.suggestions && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-slate-600">
                    <span className="font-semibold text-slate-800">Improvement Suggestion: </span>
                    <span>{fb.suggestions}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
