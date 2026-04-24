import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Login.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetch(`/api/auth/verify-email?token=${token}`)
        .then(r => r.json())
        .then(data => {
          if (data.message) { setStatus('success'); setMessage(data.message); }
          else { setStatus('error'); setMessage(data.error || 'Verification failed'); }
        })
        .catch(() => { setStatus('error'); setMessage('Verification failed'); });
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  return (
    <div className="login-page">
      <div className="login-background"><div className="login-shape shape-1"></div></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">AI</div>
            <h1>Email Verification</h1>
          </div>
          <div style={{textAlign:'center',padding:'2rem'}}>
            {status === 'verifying' && <><div className="spinner" style={{margin:'0 auto 1rem'}}></div><p>Verifying your email...</p></>}
            {status === 'success' && <><div style={{fontSize:'3rem',marginBottom:'1rem'}}>✓</div><p className="alert alert-success">{message}</p></>}
            {status === 'error' && <><div style={{fontSize:'3rem',marginBottom:'1rem'}}>✗</div><p className="alert alert-error">{message}</p></>}
            <Link to="/login" className="btn btn-primary" style={{marginTop:'1rem'}}>Go to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
