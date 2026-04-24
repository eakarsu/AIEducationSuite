import React, { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiDownload, FiTrash2 } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try { const data = await api.settings.get(); setSettings(data); }
    catch (err) { setError('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setError(''); setSuccess('');
    try {
      const updated = await api.settings.update(settings);
      setSettings(updated);
      setSuccess('Settings saved successfully');
    } catch (err) { setError(err.message); }
  };

  const handleExportData = async () => {
    try {
      const data = await api.gdpr.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'my_data_export.json'; a.click();
      URL.revokeObjectURL(url);
      setSuccess('Data exported successfully');
    } catch (err) { setError(err.message); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE MY ACCOUNT') { setError('Please type "DELETE MY ACCOUNT" to confirm'); return; }
    try {
      await api.gdpr.deleteAccount(deleteConfirm);
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading settings...</p></div>;

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiSettings /> Settings</h1><p>Customize your experience</p></div></div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="detail-view" style={{marginBottom:'1.5rem'}}>
          <div className="detail-content">
            <div className="detail-section"><h3>Appearance</h3>
              <div className="form-group"><label className="form-label">Theme</label>
                <select className="form-select" value={settings?.theme || 'light'} onChange={e => setSettings({...settings, theme: e.target.value})}>
                  <option value="light">Light</option><option value="dark">Dark</option>
                </select></div>
              <div className="form-group"><label className="form-label">Language</label>
                <select className="form-select" value={settings?.language || 'en'} onChange={e => setSettings({...settings, language: e.target.value})}>
                  <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
                </select></div>
            </div>
            <div className="detail-section"><h3>Notifications</h3>
              <div className="form-group"><label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <input type="checkbox" checked={settings?.notifications_enabled !== false} onChange={e => setSettings({...settings, notifications_enabled: e.target.checked})} /> Enable notifications
              </label></div>
              <div className="form-group"><label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <input type="checkbox" checked={settings?.email_notifications !== false} onChange={e => setSettings({...settings, email_notifications: e.target.checked})} /> Email notifications
              </label></div>
            </div>
            <div className="detail-section"><h3>Display</h3>
              <div className="form-group"><label className="form-label">Items per page</label>
                <select className="form-select" value={settings?.items_per_page || 15} onChange={e => setSettings({...settings, items_per_page: parseInt(e.target.value)})}>
                  <option value={10}>10</option><option value={15}>15</option><option value={20}>20</option><option value={50}>50</option>
                </select></div>
            </div>
            <button className="btn btn-primary" onClick={handleSave}><FiSave /> Save Settings</button>
          </div>
        </div>

        <div className="detail-view" style={{marginBottom:'1.5rem'}}>
          <div className="detail-content">
            <div className="detail-section"><h3>Data & Privacy</h3>
              <p style={{marginBottom:'1rem',color:'var(--gray-500)'}}>Download all your data or delete your account</p>
              <button className="btn btn-secondary" onClick={handleExportData}><FiDownload /> Download My Data</button>
            </div>
          </div>
        </div>

        <div className="detail-view" style={{border:'1px solid var(--danger)'}}>
          <div className="detail-content">
            <div className="detail-section"><h3 style={{color:'var(--danger)'}}>Danger Zone</h3>
              <p style={{marginBottom:'1rem',color:'var(--gray-500)'}}>Permanently delete your account and all associated data. This action cannot be undone.</p>
              <div className="form-group"><label className="form-label">Type "DELETE MY ACCOUNT" to confirm</label>
                <input className="form-input" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" /></div>
              <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE MY ACCOUNT'}><FiTrash2 /> Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
