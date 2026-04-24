import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiArrowLeft, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import './FeaturePage.css';

function Learning() {
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    current_level: 'Beginner',
    target_level: 'Intermediate',
    goals: ''
  });
  const [error, setError] = useState('');

  const subjects = ['Programming', 'Data Science', 'AI/ML', 'Design', 'Marketing', 'Finance', 'Language', 'Music', 'Art', 'Business', 'Communication', 'Wellness'];
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional', 'Certified'];

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      const data = await api.learning.getAll();
      setPaths(data);
    } catch (err) {
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.learning.create(formData);
      setPaths([result.path, ...paths]);
      setShowModal(false);
      setFormData({ title: '', subject: '', current_level: 'Beginner', target_level: 'Intermediate', goals: '' });
      if (result.path) {
        setSelectedPath(result.path);
      }
    } catch (err) {
      setError(err.message || 'Failed to create learning path');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.learning.update(editingPath.id, formData);
      setPaths(paths.map(p => p.id === editingPath.id ? result.path : p));
      setShowModal(false);
      setEditingPath(null);
      setFormData({ title: '', subject: '', current_level: 'Beginner', target_level: 'Intermediate', goals: '' });
      if (result.path) {
        setSelectedPath(result.path);
      }
    } catch (err) {
      setError(err.message || 'Failed to update learning path');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this learning path?')) return;

    setActionLoading(true);
    try {
      await api.learning.delete(id);
      setPaths(paths.filter(p => p.id !== id));
      if (selectedPath?.id === id) {
        setSelectedPath(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete learning path');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async (id) => {
    setActionLoading(true);
    try {
      const result = await api.learning.regenerate(id);
      setPaths(paths.map(p => p.id === id ? result.path : p));
      if (selectedPath?.id === id) {
        setSelectedPath(result.path);
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate learning path');
    } finally {
      setActionLoading(false);
    }
  };

  const loadSampleData = () => {
    setFormData({
      title: 'Full Stack Web Development Mastery',
      subject: 'Programming',
      current_level: 'Beginner',
      target_level: 'Advanced',
      goals: 'Learn HTML, CSS, JavaScript, React, Node.js, and databases to build complete web applications from scratch. Goal is to be able to build and deploy production-ready full-stack applications independently.'
    });
    setError('');
  };

  const openCreateModal = () => {
    setEditingPath(null);
    setFormData({ title: '', subject: '', current_level: 'Beginner', target_level: 'Intermediate', goals: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (path) => {
    setEditingPath(path);
    setFormData({
      title: path.title,
      subject: path.subject,
      current_level: path.current_level,
      target_level: path.target_level,
      goals: path.goals || ''
    });
    setShowModal(true);
    setError('');
  };

  const parseAIResponse = (path) => {
    if (path.ai_response) {
      try {
        return typeof path.ai_response === 'string'
          ? JSON.parse(path.ai_response)
          : path.ai_response;
      } catch {
        return null;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading learning paths...</p>
      </div>
    );
  }

  if (selectedPath) {
    const aiData = parseAIResponse(selectedPath);

    return (
      <div className="feature-page">
        <div className="page-header learning">
          <div className="container">
            <button className="btn btn-secondary" onClick={() => setSelectedPath(null)}>
              <FiArrowLeft /> Back to Learning Paths
            </button>
          </div>
        </div>

        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{selectedPath.title}</h1>
                <div className="detail-meta">
                  <span className="badge badge-primary">{selectedPath.subject}</span>
                  <span className="badge badge-info">
                    {selectedPath.current_level} → {selectedPath.target_level}
                  </span>
                  {selectedPath.timeline && (
                    <span>{selectedPath.timeline}</span>
                  )}
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRegenerate(selectedPath.id)}
                  disabled={actionLoading}
                >
                  <FiRefreshCw /> Regenerate
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(selectedPath)}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedPath.id)}
                  disabled={actionLoading}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              {selectedPath.goals && (
                <div className="detail-section">
                  <h3>Learning Goals</h3>
                  <p>{selectedPath.goals}</p>
                </div>
              )}

              {aiData && (
                <AIResponseDisplay data={aiData} type="learning" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header learning">
        <div className="container">
          <h1><FiTrendingUp /> AI Learning Path Creator</h1>
          <p>Create personalized curriculum and track your learning journey</p>
        </div>
      </div>

      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{paths.length} learning paths</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Create Path
            </button>
          </div>
        </div>

        {paths.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <h3>No learning paths yet</h3>
            <p>Create your first personalized learning path</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Create Learning Path
            </button>
          </div>
        ) : (
          <div className="data-list">
            {paths.map((path) => (
              <div
                key={path.id}
                className="data-list-item"
                onClick={() => setSelectedPath(path)}
              >
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{path.title}</div>
                  <div className="data-list-item-meta">
                    {path.subject} • {path.current_level} → {path.target_level}
                    {path.timeline && ` • ${path.timeline}`}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(path)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(path.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPath ? 'Edit Learning Path' : 'Create New Learning Path'}
        size="large"
      >
        <form onSubmit={editingPath ? handleUpdate : handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}

          {!editingPath && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadSampleData}>
                <FiDownload /> Load Sample Data
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Learning Path Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Full Stack Web Development"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject Area</label>
              <select
                className="form-select"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              >
                <option value="">Select subject</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Current Level</label>
              <select
                className="form-select"
                value={formData.current_level}
                onChange={(e) => setFormData({ ...formData, current_level: e.target.value })}
                required
              >
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Level</label>
              <select
                className="form-select"
                value={formData.target_level}
                onChange={(e) => setFormData({ ...formData, target_level: e.target.value })}
                required
              >
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Learning Goals (Optional)</label>
            <textarea
              className="form-textarea"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="Describe what you want to achieve with this learning path..."
              rows={4}
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  {editingPath ? 'Updating...' : 'Generating...'}
                </>
              ) : (
                editingPath ? 'Update Path' : 'Generate Learning Path'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Learning;
