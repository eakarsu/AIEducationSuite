import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiMusic, FiHelpCircle, FiBook, FiTrendingUp, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/essays', icon: <FiFileText />, label: 'Essay Grader' },
    { to: '/music', icon: <FiMusic />, label: 'Music Teacher' },
    { to: '/quizzes', icon: <FiHelpCircle />, label: 'Quiz Maker' },
    { to: '/reading', icon: <FiBook />, label: 'Reading Analyzer' },
    { to: '/learning', icon: <FiTrendingUp />, label: 'Learning Paths' }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="navbar-logo">AI</span>
          <span className="navbar-title">Education Suite</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`navbar-link ${isActive(link.to) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="navbar-user">
            <span className="navbar-user-name">{user?.name || user?.email}</span>
            <button onClick={onLogout} className="navbar-logout">
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
