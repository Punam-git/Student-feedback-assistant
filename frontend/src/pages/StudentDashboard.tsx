import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckCircle, AlertTriangle, ArrowRight, BookOpen,
  MessageSquareText, History, Star, School, ShieldAlert, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { feedbackApi } from '../services/api';
import type { Subject, FeedbackSubmission } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [history, setHistory] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      feedbackApi.getSubjects(),
      feedbackApi.getMyHistory().catch(() => [])
    ])
      .then(([subs, hist]) => {
        setSubjects(subs);
        setHistory(hist);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedSubjectIds = new Set(history.map((h) => h.subject_id));
  const completedCount = completedSubjectIds.size;
  const totalCount = subjects.length || 6;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Top Welcome Banner */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-blue-100/50 via-cyan-50/30 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.full_name || 'Student'}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>B.Tech Computer Science & Engineering, Semester 5 • Roll #CS22B042</span>
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold">CIE Evaluation Cycle Active</div>
              <div className="text-amber-700">Submissions close in 4 days (23:59 IST)</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">
              Semester Evaluation Progress: {completedCount} of {totalCount} Completed
            </span>
            <span className="text-blue-600 font-bold">{progressPercent}% Finished</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 3 Metric Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Evaluations</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {Math.max(0, totalCount - completedCount)} Courses
            </div>
            <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">
              Action recommended for grade clearance
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted Reviews</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{completedCount} Completed</div>
            <Link to="/history" className="text-xs text-blue-600 font-semibold mt-1 inline-flex items-center gap-1 hover:underline">
              <span>View my history</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Academic Advisory Console</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">Active & Grounded</div>
            <Link to="/chat" className="text-xs text-blue-600 font-semibold mt-1 inline-flex items-center gap-1 hover:underline">
              <span>Consult Advisor</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquareText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Enrolled Courses Queue */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enrolled Semester Courses</h2>
            <p className="text-xs text-slate-500">Select an enrolled course to submit your teaching evaluation</p>
          </div>
          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Submit Feedback</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading enrolled courses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const isDone = completedSubjectIds.has(sub.id);
              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-800">
                        {sub.code}
                      </span>
                      {isDone ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Submitted</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{sub.name}</h3>
                    <p className="text-xs text-slate-500">{sub.faculty_name}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Semester {sub.semester}</span>
                    <Link
                      to={`/submit?subject_id=${sub.id}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isDone
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      }`}
                    >
                      {isDone ? 'Update Review' : 'Evaluate Course'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
