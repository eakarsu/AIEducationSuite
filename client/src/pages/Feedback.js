import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiPlus, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import './FeaturePage.css';

function Feedback() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'general', subject: '', message: '' });
  const [error, setError] = useState('');

  useEffect(() => { loadFeedback(); }, []);

  const loadFeedback = async () => {
    try { const data = await api.feedback.getAll(); setItems(data); }
    catch (err) { setError('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await api.feedback.create(formData);
      setItems([result, ...items]);
      setShowModal(false);
      setFormData({ type: 'general', subject: '', message: '' });
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await api.feedback.delete(id);
      setItems(items.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) { setError(err.message); }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', in_progress: 'badge-info', under_review: 'badge-primary', resolved: 'badge-success' };
    return map[status] || 'badge-info';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading feedback...</p></div>;

  if (selected) {
    return (
      <div className="feature-page">
        <div className="page-header"><div className="container">
          <button className="btn btn-secondary" onClick={() => setSelected(null)}><FiArrowLeft /> Back</button>
        </div></div>
        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div><h1 className="detail-title">{selected.subject}</h1>
                <div className="detail-meta">
                  <span className={`badge ${getStatusBadge(selected.status)}`}>{selected.status}</span>
                  <span className="badge badge-info">{selected.type}</span>
                  <span>{new Date(selected.created_at).toLocaleString()}</span>
                </div></div>
              <div className="detail-actions">
                <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}><FiTrash2 /> Delete</button>
              </div>
            </div>
            <div className="detail-content">
              <div className="detail-section"><h3>Message</h3><div className="content-box"><p>{selected.message}</p></div></div>
              {selected.admin_response && <div className="detail-section"><h3>Admin Response</h3><div className="content-box" style={{borderLeft:'3px solid var(--success)'}}><p>{selected.admin_response}</p></div></div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiMessageSquare /> Feedback</h1><p>Share your feedback and suggestions</p></div></div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="toolbar">
          <div className="toolbar-left"><span className="text-muted">{items.length} feedback items</span></div>
          <div className="toolbar-right"><button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Feedback</button></div>
        </div>
        {items.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💬</div><h3>No feedback yet</h3><p>Share your thoughts with us</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Submit Feedback</button></div>
        ) : (
          <div className="data-list">
            {items.map(item => (
              <div key={item.id} className="data-list-item" onClick={() => setSelected(item)}>
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{item.subject}</div>
                  <div className="data-list-item-meta">
                    <span className={`badge ${getStatusBadge(item.status)}`} style={{marginRight:'0.5rem'}}>{item.status}</span>
                    <span className="badge badge-info" style={{marginRight:'0.5rem'}}>{item.type}</span>
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Feedback">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="general">General</option><option value="bug">Bug Report</option><option value="feature">Feature Request</option>
            </select></div>
          <div className="form-group"><label className="form-label">Subject</label>
            <input className="form-input" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Message</label>
            <textarea className="form-textarea" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required rows={5} /></div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Feedback;
