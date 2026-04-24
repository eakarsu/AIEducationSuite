import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './Login.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = await api.resetPassword(token, password);
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
            <h1>Reset Password</h1>
            <p>Enter your new password</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success} <Link to="/login" style={{color:'var(--primary)'}}>Login now</Link></div>}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
