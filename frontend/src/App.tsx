import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { SubmitFeedbackPage } from './pages/SubmitFeedbackPage';
import { FeedbackHistoryPage } from './pages/FeedbackHistoryPage';
import { ChatAssistantPage } from './pages/ChatAssistantPage';
import { KnowledgeSearchPage } from './pages/KnowledgeSearchPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { KnowledgeManagementPage } from './pages/KnowledgeManagementPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/submit" element={<SubmitFeedbackPage />} />
              <Route path="/history" element={<FeedbackHistoryPage />} />
              <Route path="/chat" element={<ChatAssistantPage />} />
              <Route path="/search" element={<KnowledgeSearchPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/knowledge" element={<KnowledgeManagementPage />} />
              <Route path="/status" element={<SystemStatusPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
