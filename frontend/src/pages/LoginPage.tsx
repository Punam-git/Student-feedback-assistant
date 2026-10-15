import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, ShieldCheck, Mail, Lock, ArrowRight,
  School, CheckCircle2, AlertCircle, Building2, BookOpen, Clock, FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('student@institution.edu');
  const [password, setPassword] = useState('Student@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
    if (role === 'admin') {
      setEmail('admin@institution.edu');
      setPassword('Admin@123');
    } else {
      setEmail('student@institution.edu');
      setPassword('Student@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      if (activeRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Authentication failed. Please verify your institutional credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100/70">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: Institutional Campus & Guidelines Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle architectural grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Crest & Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 border border-blue-400/30 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight leading-tight">
                  Department of Computer Science
                </span>
                <span className="text-xs text-blue-300 font-medium">
                  Continuous Evaluation & Feedback System
                </span>
              </div>
            </div>

            {/* Academic Cohort Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs w-fit">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Academic Year 2025–2026 • Odd Semester</span>
            </div>

            {/* Evaluation Guidelines */}
            <div className="mt-4 flex flex-col gap-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>CIE Evaluation Cycle:</strong> Students must submit constructive evaluations for all enrolled courses before the semester deadline.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Confidentiality Protection:</strong> Optional anonymous submission completely unlinks user identities in accordance with institutional policy.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Curriculum Action:</strong> Aggregate analytics and student suggestions directly drive departmental Board of Studies updates.
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Accredited Academic Portal</span>
            <span>v1.0.0 Production</span>
          </div>
        </div>

        {/* Right Side: Professional Student / Faculty Sign-In Terminal */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Top Role Selector Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeRole === 'student' ? 'Student Portal Sign In' : 'Faculty & Admin Portal'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {activeRole === 'student'
                    ? 'Enter your institutional email or roll number to access evaluation rubrics.'
                    : 'Access departmental analytics, feedback trends, and RAG knowledge controls.'}
                </p>
              </div>

              {/* Portal Toggle Button */}
              <button
                type="button"
                onClick={() => handleRoleChange(activeRole === 'student' ? 'admin' : 'student')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-1.5"
              >
                {activeRole === 'student' ? (
                  <>
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Faculty Sign In</span>
                  </>
                ) : (
                  <>
                    <School className="w-3.5 h-3.5" />
                    <span>Student Sign In</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {activeRole === 'student' ? 'Institutional Email / Roll Number' : 'Administrator Email'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeRole === 'student' ? 'student@institution.edu' : 'admin@institution.edu'}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password / Access Key
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('For credential recovery or institutional password reset, please contact your department academic coordinator.');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Remember this workstation</span>
                </label>
                <span className="text-slate-400">Single Sign-On Verified</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating Credentials...</span>
                ) : (
                  <>
                    <span>Authenticate & Access {activeRole === 'student' ? 'Student Hub' : 'Faculty Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Viva Demonstration Credentials Bar */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="font-semibold text-slate-700 block">Demonstration Account Ready:</span>
              <span className="text-slate-500 font-mono text-[11px]">
                {activeRole === 'student' ? 'student@institution.edu / Student@123' : 'admin@institution.edu / Admin@123'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRoleChange(activeRole)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors w-fit"
            >
              Autofill Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
