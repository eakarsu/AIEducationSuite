import React, { useState, useEffect } from 'react';
import { FiUser, FiEdit2, FiSave, FiLock } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const data = await api.profile.get();
      setProfile(data);
      setFormData({ name: data.name || '', bio: data.bio || '', phone: data.phone || '', timezone: data.timezone || 'UTC' });
    } catch (err) { setError('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const updated = await api.profile.update(formData);
      setProfile(updated);
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) { setError(err.message); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      await api.profile.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading profile...</p></div>;

  return (
    <div className="feature-page">
      <div className="page-header">
        <div className="container"><h1><FiUser /> My Profile</h1><p>Manage your account information</p></div>
      </div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="detail-view">
          <div className="detail-header">
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'var(--gradient-primary)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'1.5rem',fontWeight:'bold'}}>
                {(profile?.name || profile?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="detail-title">{profile?.name || 'No Name Set'}</h1>
                <div className="detail-meta">
                  <span>{profile?.email}</span>
                  <span className="badge badge-primary">{profile?.role}</span>
                  {profile?.email_verified && <span className="badge badge-success">Verified</span>}
                </div>
              </div>
            </div>
            <div className="detail-actions">
              {!editing && <button className="btn btn-secondary" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>}
              <button className="btn btn-secondary" onClick={() => setShowPasswordForm(!showPasswordForm)}><FiLock /> Change Password</button>
            </div>
          </div>
          <div className="detail-content">
            {editing ? (
              <form onSubmit={handleSave}>
                <div className="form-group"><label className="form-label">Name</label>
                  <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Bio</label>
                  <textarea className="form-textarea" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Phone</label>
                    <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Timezone</label>
                    <select className="form-select" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})}>
                      <option>UTC</option><option>America/New_York</option><option>America/Chicago</option><option>America/Los_Angeles</option><option>Europe/London</option><option>Europe/Paris</option><option>Asia/Tokyo</option>
                    </select></div>
                </div>
                <div style={{display:'flex',gap:'0.75rem',marginTop:'1rem'}}>
                  <button type="submit" className="btn btn-primary"><FiSave /> Save</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="detail-section"><h3>Bio</h3><p>{profile?.bio || 'No bio set'}</p></div>
                <div className="detail-section"><h3>Contact</h3><p>Phone: {profile?.phone || 'Not set'}</p><p>Timezone: {profile?.timezone || 'UTC'}</p></div>
                <div className="detail-section"><h3>Account</h3><p>Member since: {new Date(profile?.created_at).toLocaleDateString()}</p></div>
              </>
            )}
            {showPasswordForm && (
              <div className="detail-section" style={{marginTop:'2rem',padding:'1.5rem',background:'var(--gray-50)',borderRadius:'var(--radius)'}}>
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group"><label className="form-label">Current Password</label>
                    <input type="password" className="form-input" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">New Password</label>
                    <input type="password" className="form-input" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required minLength={6} /></div>
                  <div className="form-group"><label className="form-label">Confirm New Password</label>
                    <input type="password" className="form-input" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} required /></div>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
