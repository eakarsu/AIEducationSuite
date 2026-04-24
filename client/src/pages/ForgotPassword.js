import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = await api.forgotPassword(email);
      setSuccess(data.message);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">AI</div>
            <h1>Forgot Password</h1>
            <p>Enter your email to receive a reset link</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div style={{textAlign:'center',marginTop:'1rem'}}>
              <Link to="/login" style={{color:'var(--primary)'}}>Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
