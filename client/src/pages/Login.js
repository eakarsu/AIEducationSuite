import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import './Login.css';

function __demoAutofill() {
  (async () => {
    let email = "";
    let password = "";
    try {
      const response = await fetch("/api/auth/demo-credentials", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        email = data.email || data.username || "";
        password = data.password || "";
      }
    } catch (error) {
      /* fall back to build-time credentials below */
    }
    if (!email || !password) {
      const env = (typeof process !== "undefined" && process.env) ? process.env : {};
      email = email || env.REACT_APP_DEMO_EMAIL || env.VITE_DEMO_EMAIL || "";
      password = password || env.REACT_APP_DEMO_PASSWORD || env.VITE_DEMO_PASSWORD || "";
    }
    const form = document.querySelector("form");
    const setValue = (element, value) => {
      if (!element) return;
      const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const scope = form || document;
    setValue(scope.querySelector('input[type="email"], input[name="email"], input[name="username"]') || scope.querySelectorAll("input")[0], email);
    setValue(scope.querySelector('input[type="password"], input[name="password"]') || scope.querySelectorAll("input")[1], password);
    window.setTimeout(() => {
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        const submit = scope.querySelector('button[type="submit"], input[type="submit"]');
        if (submit) submit.click();
      }
    }, 50);
  })();
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login(email, password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async () => {
    try {
      const credentials = await api.getDemoCredentials();
      setEmail(credentials.email);
      setPassword(credentials.password);
      setError('');
    } catch (err) {
      setError('Failed to get demo credentials');
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
        <div className="login-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">AI</div>
            <h1>AI Education Suite</h1>
            <p>Your comprehensive AI-powered learning platform</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Forgot Password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span> Signing in...</>
              ) : 'Sign In'}
            </button>

            <div className="login-divider"><span>or</span></div>

            <button type="button" className="btn btn-secondary btn-lg login-demo" onClick={__demoAutofill}>
              Auto Fill Demo Credentials
            </button>
          </form>

          <div className="login-features">
            <h3>Features</h3>
            <ul>
              <li><span className="feature-icon">📝</span><span>AI Essay Grader</span></li>
              <li><span className="feature-icon">🎵</span><span>AI Music Teacher</span></li>
              <li><span className="feature-icon">❓</span><span>AI Quiz Maker</span></li>
              <li><span className="feature-icon">📖</span><span>AI Reading Analyzer</span></li>
              <li><span className="feature-icon">📈</span><span>AI Learning Paths</span></li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
            <Link to="/privacy" style={{ color: 'var(--gray-400)', marginRight: '1rem' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'var(--gray-400)' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
