import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Essays from './pages/Essays';
import Music from './pages/Music';
import Quizzes from './pages/Quizzes';
import Reading from './pages/Reading';
import Learning from './pages/Learning';
import LanguageImmersion from './pages/LanguageImmersion';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Progress from './pages/Progress';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Feedback from './pages/Feedback';
import Contact from './pages/Contact';
import AuditLogs from './pages/AuditLogs';
import TutorChat from './pages/TutorChat';
import AITools from './pages/AITools';
import MasteryIntervention from './pages/MasteryIntervention';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Sidebar from './components/Sidebar';
import Onboarding from './components/Onboarding';
import './i18n';
import './App.css';

import Batch03Features from './pages/Batch03Features';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setIsAuthenticated(true);
          setUser(data.user);
          if (data.user.onboarding_completed === false) {
            setShowOnboarding(true);
          }
        }
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);
    if (userData.onboarding_completed === false) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          {isAuthenticated && <Sidebar user={user} onLogout={handleLogout} />}
          <main className={isAuthenticated ? 'main-content' : ''}>
            <a href="#main-content" className="skip-link">Skip to content</a>
            <div id="main-content">
              <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

          <Route path="/batch03" element={<Batch03Features />} />
                {/* Public routes */}
                <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
                <Route path="/essays/*" element={<ProtectedRoute><Essays /></ProtectedRoute>} />
                <Route path="/music/*" element={<ProtectedRoute><Music /></ProtectedRoute>} />
                <Route path="/quizzes/*" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
                <Route path="/reading/*" element={<ProtectedRoute><Reading /></ProtectedRoute>} />
                <Route path="/learning/*" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
                <Route path="/language/*" element={<ProtectedRoute><LanguageImmersion /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
                <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
                <Route path="/tutor-chat" element={<ProtectedRoute><TutorChat /></ProtectedRoute>} />
                <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
                <Route path="/mastery-intervention" element={<ProtectedRoute><MasteryIntervention /></ProtectedRoute>} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
              </Routes>
            </div>
          </main>
          {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
