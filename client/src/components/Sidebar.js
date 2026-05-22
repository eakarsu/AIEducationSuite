import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiMusic, FiHelpCircle, FiBook, FiTrendingUp, FiLogOut, FiMenu, FiX, FiUser, FiSettings, FiSearch, FiActivity, FiMessageSquare, FiMail, FiShield, FiList, FiSun, FiMoon, FiGlobe, FiZap, FiTarget } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from './NotificationBell';
import './Sidebar.css';

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const mainLinks = [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/essays', icon: <FiFileText />, label: 'Essay Grader' },
    { to: '/music', icon: <FiMusic />, label: 'Music Teacher' },
    { to: '/quizzes', icon: <FiHelpCircle />, label: 'Quiz Maker' },
    { to: '/reading', icon: <FiBook />, label: 'Reading Analyzer' },
    { to: '/learning', icon: <FiTrendingUp />, label: 'Learning Paths' },
    { to: '/mastery-intervention', icon: <FiTarget />, label: 'Mastery Plan' },
    { to: '/language', icon: <FiGlobe />, label: 'Language Immersion' },
    { to: '/tutor-chat', icon: <FiMessageSquare />, label: 'AI Tutor Chat' },
    { to: '/ai-tools', icon: <FiZap />, label: 'AI Tools' }
  ];

  const toolLinks = [
    { to: '/progress', icon: <FiActivity />, label: 'Progress' },
    { to: '/search', icon: <FiSearch />, label: 'Search' }
  ];

  const commLinks = [
    { to: '/feedback', icon: <FiMessageSquare />, label: 'Feedback' },
    { to: '/contact', icon: <FiMail />, label: 'Support' }
  ];

  const adminLinks = (user?.role === 'admin' || user?.role === 'teacher') ? [
    { to: '/admin', icon: <FiShield />, label: 'Admin Panel' },
    ...(user?.role === 'admin' ? [{ to: '/audit-logs', icon: <FiList />, label: 'Audit Logs' }] : [])
  ] : [];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const closeMobile = () => setMobileOpen(false);

  const renderLinks = (links) => links.map((link) => (
    <li key={link.to}>
      <Link to={link.to} className={`sidebar-link ${isActive(link.to) ? 'sidebar-link--active' : ''}`} onClick={closeMobile}>
        <span className="sidebar-link-icon">{link.icon}</span>
        <span className="sidebar-link-label">{link.label}</span>
      </Link>
    </li>
  ));

  return (
    <>
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`} role="navigation">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-brand-link" onClick={closeMobile}>
            <span className="sidebar-logo">AI</span>
            <div className="sidebar-brand-text">
              <span className="sidebar-title">AI Education</span>
              <span className="sidebar-subtitle">Suite</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-links">
            {renderLinks(mainLinks)}

            <li className="sidebar-section-label">Tools</li>
            {renderLinks(toolLinks)}
            <li><NotificationBell /></li>

            <li className="sidebar-section-label">Communication</li>
            {renderLinks(commLinks)}

            {adminLinks.length > 0 && (
              <>
                <li className="sidebar-section-label">Administration</li>
                {renderLinks(adminLinks)}
              </>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />

          <button onClick={toggleTheme} className="sidebar-theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="sidebar-footer-links">
            <Link to="/profile" className="sidebar-footer-link" onClick={closeMobile}><FiUser size={14} /> Profile</Link>
            <Link to="/settings" className="sidebar-footer-link" onClick={closeMobile}><FiSettings size={14} /> Settings</Link>
            <Link to="/privacy" className="sidebar-footer-link" onClick={closeMobile}>Privacy</Link>
            <Link to="/terms" className="sidebar-footer-link" onClick={closeMobile}>Terms</Link>
          </div>

          <div className="sidebar-user">
            <Link to="/profile" className="sidebar-user-avatar" onClick={closeMobile} style={{ textDecoration: 'none', cursor: 'pointer' }}>
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </Link>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || user?.email}</span>
              {user?.role && <span className="sidebar-user-role">{user.role}</span>}
            </div>
          </div>
          <button onClick={onLogout} className="sidebar-logout">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
