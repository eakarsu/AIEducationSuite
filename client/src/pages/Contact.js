import React, { useState, useEffect } from 'react';
import { FiMail, FiSend, FiHelpCircle } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    try { const data = await api.contact.getAll(); setMessages(data); } catch (err) { /* not critical */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.contact.create(formData);
      setSuccess('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      loadMessages();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const faqs = [
    { q: 'How does the AI grading work?', a: 'Our AI analyzes your essays using advanced language models to provide detailed feedback on structure, grammar, and content quality.' },
    { q: 'Can I use this for my school?', a: 'Yes! Contact us about school and district licensing options for bulk access.' },
    { q: 'Is my data secure?', a: 'We take data security seriously. All data is encrypted and you can export or delete your data at any time.' },
    { q: 'How do I reset my password?', a: 'Click "Forgot Password?" on the login page and follow the email instructions.' }
  ];

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiMail /> Contact & Support</h1><p>Get help or send us a message</p></div></div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
          <div>
            <div className="detail-view">
              <div className="detail-content">
                <h3>Send us a message</h3>
                <form onSubmit={handleSubmit} style={{marginTop:'1rem'}}>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Name</label>
                      <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Email</label>
                      <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Subject</label>
                    <input className="form-input" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Message</label>
                    <textarea className="form-textarea" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required rows={5} /></div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : <><FiSend /> Send Message</>}
                  </button>
                </form>
              </div>
            </div>
            {messages.length > 0 && (
              <div className="detail-view" style={{marginTop:'1.5rem'}}>
                <div className="detail-content">
                  <h3>Your Messages</h3>
                  <div className="data-list" style={{marginTop:'1rem'}}>
                    {messages.map(m => (
                      <div key={m.id} className="data-list-item" style={{cursor:'default'}}>
                        <div className="data-list-item-content">
                          <div className="data-list-item-title">{m.subject}</div>
                          <div className="data-list-item-meta">
                            <span className={`badge ${m.status === 'resolved' ? 'badge-success' : m.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`}>{m.status}</span>
                            <span style={{marginLeft:'0.5rem'}}>{new Date(m.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="detail-view">
              <div className="detail-content">
                <h3><FiHelpCircle /> Frequently Asked Questions</h3>
                <div style={{marginTop:'1rem'}}>
                  {faqs.map((faq, i) => (
                    <div key={i} style={{marginBottom:'1.5rem'}}>
                      <h4 style={{marginBottom:'0.5rem',color:'var(--gray-800)'}}>{faq.q}</h4>
                      <p style={{color:'var(--gray-500)'}}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
