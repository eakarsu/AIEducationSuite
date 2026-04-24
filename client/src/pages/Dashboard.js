import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiMusic, FiHelpCircle, FiBook, FiTrendingUp, FiActivity, FiSearch, FiBell, FiMessageSquare, FiUser, FiSettings, FiMail, FiShield } from 'react-icons/fi';
import { api } from '../utils/api';
import './Dashboard.css';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    essays: 0, music: 0, quizzes: 0, reading: 0, learning: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [essays, music, quizzes, reading, learning] = await Promise.all([
        api.essays.getAll(),
        api.music.getAll(),
        api.quizzes.getAll(),
        api.reading.getAll(),
        api.learning.getAll()
      ]);

      setStats({
        essays: Array.isArray(essays) ? essays.length : 0,
        music: Array.isArray(music) ? music.length : 0,
        quizzes: Array.isArray(quizzes) ? quizzes.length : 0,
        reading: Array.isArray(reading) ? reading.length : 0,
        learning: Array.isArray(learning) ? learning.length : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const aiFeatures = [
    { id: 'essays', title: 'AI Essay Grader', description: 'Get instant feedback and grades on your essays', icon: <FiFileText />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', path: '/essays', count: stats.essays },
    { id: 'music', title: 'AI Music Teacher', description: 'Learn instruments with personalized lessons', icon: <FiMusic />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', path: '/music', count: stats.music },
    { id: 'quizzes', title: 'AI Quiz Maker', description: 'Generate custom quizzes from any content', icon: <FiHelpCircle />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', path: '/quizzes', count: stats.quizzes },
    { id: 'reading', title: 'AI Reading Analyzer', description: 'Analyze reading difficulty and get recommendations', icon: <FiBook />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', path: '/reading', count: stats.reading },
    { id: 'learning', title: 'AI Learning Paths', description: 'Create personalized curriculum and track learning', icon: <FiTrendingUp />, gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)', path: '/learning', count: stats.learning }
  ];

  const toolCards = [
    { id: 'progress', title: 'Progress', description: 'Track your learning journey', icon: <FiActivity />, gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', path: '/progress' },
    { id: 'search', title: 'Search', description: 'Find anything in your content', icon: <FiSearch />, gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', path: '/search' },
    { id: 'notifications', title: 'Notifications', description: 'Stay updated on your progress', icon: <FiBell />, gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', path: '/notifications' },
    { id: 'feedback', title: 'Feedback', description: 'Share suggestions and reports', icon: <FiMessageSquare />, gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', path: '/feedback' },
    { id: 'profile', title: 'Profile', description: 'Manage your account', icon: <FiUser />, gradient: 'linear-gradient(135deg, #f5576c 0%, #ff6f61 100%)', path: '/profile' },
    { id: 'settings', title: 'Settings', description: 'Customize your experience', icon: <FiSettings />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', path: '/settings' },
    { id: 'contact', title: 'Support', description: 'Get help and contact us', icon: <FiMail />, gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', path: '/contact' }
  ];

  if (user?.role === 'admin' || user?.role === 'teacher') {
    toolCards.push({ id: 'admin', title: 'Admin Panel', description: 'Manage users and platform', icon: <FiShield />, gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)', path: '/admin' });
  }

  const handleCardClick = (path) => navigate(path);

  if (loading) {
    return (
      <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-welcome">
        <div className="container">
          <div className="dashboard-welcome-content">
            <div>
              <h1>Welcome back, {user?.name || 'Learner'}!</h1>
              <p>Explore your AI-powered learning tools</p>
            </div>
            <div className="dashboard-stats-summary">
              <div className="stat-pill">
                <span className="stat-pill-value">{stats.essays + stats.music + stats.quizzes + stats.reading + stats.learning}</span>
                <span className="stat-pill-label">Total Items</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="features-grid">
            {aiFeatures.map((feature) => (
              <div key={feature.id} className="feature-card" onClick={() => handleCardClick(feature.path)}>
                <div className="feature-card-icon" style={{ background: feature.gradient }}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-card-count">{feature.count} {feature.count === 1 ? 'item' : 'items'}</div>
              </div>
            ))}
          </div>

          <section style={{ marginTop: '2rem' }}>
            <h2 className="section-title">Tools & Settings</h2>
            <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {toolCards.map((card) => (
                <div key={card.id} className="feature-card" onClick={() => handleCardClick(card.path)} style={{ padding: '1.25rem' }}>
                  <div className="feature-card-icon" style={{ background: card.gradient, width: '40px', height: '40px', fontSize: '1rem' }}>{card.icon}</div>
                  <h3 style={{ fontSize: '1rem' }}>{card.title}</h3>
                  <p style={{ fontSize: '0.8125rem' }}>{card.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-quick-stats">
            <h2 className="section-title">Quick Overview</h2>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">Essays Graded</div><div className="stat-value text-primary">{stats.essays}</div></div>
              <div className="stat-card"><div className="stat-label">Music Lessons</div><div className="stat-value" style={{ color: '#f093fb' }}>{stats.music}</div></div>
              <div className="stat-card"><div className="stat-label">Quizzes Created</div><div className="stat-value" style={{ color: '#4facfe' }}>{stats.quizzes}</div></div>
              <div className="stat-card"><div className="stat-label">Texts Analyzed</div><div className="stat-value" style={{ color: '#11998e' }}>{stats.reading}</div></div>
              <div className="stat-card"><div className="stat-label">Learning Paths</div><div className="stat-value" style={{ color: '#ff416c' }}>{stats.learning}</div></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
