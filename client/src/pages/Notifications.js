import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try { const data = await api.notifications.getAll(); setNotifications(data); }
    catch (err) { setError('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n));
      if (selected?.id === id) setSelected({...selected, read: true});
    } catch (err) { setError(err.message); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await api.notifications.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) { setError(err.message); }
  };

  const getTypeColor = (type) => {
    const colors = { success: 'badge-success', warning: 'badge-warning', info: 'badge-info', system: 'badge-primary' };
    return colors[type] || 'badge-info';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading notifications...</p></div>;

  if (selected) {
    return (
      <div className="feature-page">
        <div className="page-header"><div className="container">
          <button className="btn btn-secondary" onClick={() => setSelected(null)}><FiArrowLeft /> Back</button>
        </div></div>
        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div><h1 className="detail-title">{selected.title}</h1>
                <div className="detail-meta">
                  <span className={`badge ${getTypeColor(selected.type)}`}>{selected.type}</span>
                  <span>{new Date(selected.created_at).toLocaleString()}</span>
                  <span className={`badge ${selected.read ? 'badge-success' : 'badge-warning'}`}>{selected.read ? 'Read' : 'Unread'}</span>
                </div></div>
              <div className="detail-actions">
                {!selected.read && <button className="btn btn-secondary" onClick={() => handleMarkRead(selected.id)}><FiCheck /> Mark Read</button>}
                <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}><FiTrash2 /> Delete</button>
              </div>
            </div>
            <div className="detail-content"><div className="detail-section"><h3>Message</h3><p>{selected.message}</p></div></div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiBell /> Notifications</h1><p>Stay updated on your learning progress</p></div></div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="toolbar">
          <div className="toolbar-left"><span className="text-muted">{notifications.length} notifications ({unreadCount} unread)</span></div>
          <div className="toolbar-right">{unreadCount > 0 && <button className="btn btn-secondary" onClick={handleMarkAllRead}><FiCheckCircle /> Mark All Read</button>}</div>
        </div>
        {notifications.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
        ) : (
          <div className="data-list">
            {notifications.map(n => (
              <div key={n.id} className="data-list-item" onClick={() => { setSelected(n); if (!n.read) handleMarkRead(n.id); }}
                style={{borderLeft: !n.read ? '3px solid var(--primary)' : 'none', opacity: n.read ? 0.7 : 1}}>
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{n.title}</div>
                  <div className="data-list-item-meta">
                    <span className={`badge ${getTypeColor(n.type)}`} style={{marginRight:'0.5rem'}}>{n.type}</span>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n.id)}><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
