import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  BarChart3, Download, RefreshCw, Filter, Sparkles,
  TrendingUp, Award, AlertTriangle, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, feedbackApi } from '../services/api';
import type { AnalyticsOverview, Subject } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { role, switchRoleDemo } = useAuth();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [includeDemo, setIncludeDemo] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overview, subs] = await Promise.all([
        analyticsApi.getOverview({
          subject_id: selectedSubject,
          sentiment: selectedSentiment || undefined,
          include_demo: includeDemo
        }),
        feedbackApi.getSubjects()
      ]);
      setData(overview);
      setSubjects(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchData();
    }
  }, [role, selectedSubject, selectedSentiment, includeDemo]);

  const handleRerunSentiment = async () => {
    setRerunLoading(true);
    try {
      const res = await feedbackApi.rerunSentiment();
      setToastMessage(res.message);
      fetchData();
    } catch {
      setToastMessage('Failed to rerun sentiment analysis');
    } finally {
      setRerunLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const url = analyticsApi.getExportUrl({
      subject_id: selectedSubject,
      sentiment: selectedSentiment || undefined,
      include_demo: includeDemo
    });
    // Trigger download with auth token in URL or direct fetch
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `student_feedback_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  // Access Guard for Non-Admin
  if (role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Administrator Privileges Required</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
            The Institutional Analytics Dashboard provides aggregate sentiment distributions, faculty averages,
            and data export tools restricted to authenticated faculty chairs and administrators.
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

  // Sentiment chart data
  const sentimentChartData = data?.sentiment_distribution
    ? [
        { name: 'Positive', value: data.sentiment_distribution.positive, color: '#10B981' },
        { name: 'Neutral', value: data.sentiment_distribution.neutral, color: '#64748B' },
        { name: 'Negative', value: data.sentiment_distribution.negative, color: '#EF4444' },
        { name: 'Mixed', value: data.sentiment_distribution.mixed, color: '#8B5CF6' }
      ]
    : [];

  // Rating chart data
  const ratingChartData = data?.rating_distribution
    ? [
        { stars: '1 Star', count: data.rating_distribution.stars_1 },
        { stars: '2 Stars', count: data.rating_distribution.stars_2 },
        { stars: '3 Stars', count: data.rating_distribution.stars_3 },
        { stars: '4 Stars', count: data.rating_distribution.stars_4 },
        { stars: '5 Stars', count: data.rating_distribution.stars_5 }
      ]
    : [];

  // Subject comparison data
  const subjectChartData = data?.subject_stats?.map((s) => ({
    name: s.subject_code,
    fullName: s.subject_name,
    overall: s.avg_overall,
    clarity: s.avg_teaching_clarity,
    count: s.feedback_count
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <span>Institutional Feedback Analytics</span>
            </h1>
            {data?.is_demo_active && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                Demo Data Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-dimensional evaluation telemetry and longitudinal sentiment intelligence.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRerunSentiment}
            disabled={rerunLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            title="Re-run VADER sentiment engine over all stored submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${rerunLoading ? 'animate-spin' : ''}`} />
            <span>{rerunLoading ? 'Re-analyzing...' : 'Rerun Sentiment'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Control Drawer */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive Only</option>
            <option value="Neutral">Neutral Only</option>
            <option value="Negative">Negative Only</option>
            <option value="Mixed">Mixed Only</option>
          </select>
        </div>

        {/* Demo Data Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
          <input
            type="checkbox"
            checked={includeDemo}
            onChange={(e) => setIncludeDemo(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <span>Include 50 Demonstration Records</span>
        </label>
      </div>

      {loading || !data ? (
        <div className="py-20 text-center text-sm text-slate-500">Computing real-time analytics...</div>
      ) : (
        <>
          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Submissions</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{data.total_feedback}</div>
              <span className="text-[10px] text-slate-400 mt-1">Verified Evaluations</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Satisfaction Index</span>
              <div className="text-2xl font-bold text-blue-600 mt-2">{data.avg_overall_rating} / 5.0</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                {data.sentiment_distribution.positive_percentage}% Positive
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Teaching Clarity</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{data.avg_teaching_clarity} / 5.0</div>
              <span className="text-[10px] text-slate-400 mt-1">Whiteboard & Pacing</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Course Content</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{data.avg_course_content} / 5.0</div>
              <span className="text-[10px] text-slate-400 mt-1">Syllabus Quality</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Practical Sessions</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">{data.avg_practical_sessions} / 5.0</div>
              <span className="text-[10px] text-slate-400 mt-1">Lab Hands-On</span>
            </div>
          </div>

          {/* AI Grounded Summary Callout */}
          {data.ai_grounded_summary && (
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5 rounded-2xl border border-blue-100 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Automated Grounded Summary (Derived Directly from Calculations)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                  {data.ai_grounded_summary}
                </p>
              </div>
            </div>
          )}

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Sentiment Donut */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Sentiment Polarity Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Rating Histogram */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-4">5-Star Overall Rating Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="stars" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Subject Comparison */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Subject Satisfaction Benchmark</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="overall" fill="#6366F1" radius={[6, 6, 0, 0]} name="Overall Rating" />
                    <Bar dataKey="clarity" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Teaching Clarity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Daily Trends */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Longitudinal Rating Trajectory</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg_rating" stroke="#2563EB" strokeWidth={2.5} name="Mean Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Extracted Academic Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Primary Areas Signaled for Pedagogical Growth</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.top_improvement_themes.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-100 flex items-center gap-2"
                  >
                    <span>{t.theme}</span>
                    <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-[10px]">
                      {t.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Strongest Student Satisfaction Highlights</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.top_positive_highlights.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 flex items-center gap-2"
                  >
                    <span>{t.theme}</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">
                      {t.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
