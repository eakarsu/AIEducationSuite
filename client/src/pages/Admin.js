import React, { useState, useEffect } from 'react';
import { FiShield, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import './FeaturePage.css';

function Admin() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', role: 'student' });
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([api.admin.getUsers(), api.admin.getStats()]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) { setError(err.message || 'Failed to load admin data. You may not have admin permissions.'); }
    finally { setLoading(false); }
  };

  const handleEdit = (user) => {
    setEditForm({ name: user.name, role: user.role, email_verified: user.email_verified });
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.admin.updateUser(selectedUser.id, editForm);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setShowModal(false);
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.admin.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading admin panel...</p></div>;

  if (selectedUser && !showModal) {
    return (
      <div className="feature-page">
        <div className="page-header"><div className="container">
          <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}><FiArrowLeft /> Back to Users</button>
        </div></div>
        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div><h1 className="detail-title">{selectedUser.name || selectedUser.email}</h1>
                <div className="detail-meta">
                  <span>{selectedUser.email}</span>
                  <span className="badge badge-primary">{selectedUser.role}</span>
                  <span className={`badge ${selectedUser.email_verified ? 'badge-success' : 'badge-warning'}`}>{selectedUser.email_verified ? 'Verified' : 'Unverified'}</span>
                </div></div>
              <div className="detail-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(selectedUser)}><FiEdit2 /> Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(selectedUser.id)}><FiTrash2 /> Delete</button>
              </div>
            </div>
            <div className="detail-content">
              <div className="detail-section"><h3>Account Details</h3>
                <p>Created: {new Date(selectedUser.created_at).toLocaleString()}</p>
                <p>Updated: {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiShield /> Admin Panel</h1><p>Manage users and platform settings</p></div></div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        {stats && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="detail-view" style={{padding:'1rem',textAlign:'center'}}>
                <div style={{fontSize:'1.5rem',fontWeight:'bold',color:'var(--primary)'}}>{val}</div>
                <div className="text-muted" style={{textTransform:'capitalize'}}>{key.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        )}
        <div className="toolbar"><div className="toolbar-left"><span className="text-muted">{users.length} users</span></div></div>
        <div className="data-list">
          {users.map(user => (
            <div key={user.id} className="data-list-item" onClick={() => setSelectedUser(user)}>
              <div className="data-list-item-content">
                <div className="data-list-item-title">{user.name || user.email}</div>
                <div className="data-list-item-meta">{user.email} <span className={`badge badge-primary`} style={{marginLeft:'0.5rem'}}>{user.role}</span></div>
              </div>
              <div className="data-list-item-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(user)}><FiEdit2 /></button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit User">
        <form onSubmit={handleSave}>
          <div className="form-group"><label className="form-label">Name</label>
            <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-select" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
              <option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
            </select></div>
          <div className="form-group"><label style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <input type="checkbox" checked={editForm.email_verified || false} onChange={e => setEditForm({...editForm, email_verified: e.target.checked})} /> Email Verified
          </label></div>
          <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Admin;
