import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiArrowLeft, FiMusic, FiDownload } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import './FeaturePage.css';

function Music() {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    instrument: '',
    skill_level: 'Beginner',
    topic: ''
  });
  const [error, setError] = useState('');

  const instruments = ['Piano', 'Guitar', 'Violin', 'Drums', 'Bass Guitar', 'Saxophone', 'Flute', 'Ukulele', 'Trumpet', 'Cello'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const data = await api.music.getAll();
      setLessons(data);
    } catch (err) {
      setError('Failed to load music lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.music.create(formData);
      setLessons([result.lesson, ...lessons]);
      setShowModal(false);
      setFormData({ instrument: '', skill_level: 'Beginner', topic: '' });
      if (result.lesson) {
        setSelectedLesson(result.lesson);
      }
    } catch (err) {
      setError(err.message || 'Failed to create lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.music.update(editingLesson.id, formData);
      setLessons(lessons.map(l => l.id === editingLesson.id ? result.lesson : l));
      setShowModal(false);
      setEditingLesson(null);
      setFormData({ instrument: '', skill_level: 'Beginner', topic: '' });
      if (result.lesson) {
        setSelectedLesson(result.lesson);
      }
    } catch (err) {
      setError(err.message || 'Failed to update lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    setActionLoading(true);
    try {
      await api.music.delete(id);
      setLessons(lessons.filter(l => l.id !== id));
      if (selectedLesson?.id === id) {
        setSelectedLesson(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async (id) => {
    setActionLoading(true);
    try {
      const result = await api.music.regenerate(id);
      setLessons(lessons.map(l => l.id === id ? result.lesson : l));
      if (selectedLesson?.id === id) {
        setSelectedLesson(result.lesson);
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const loadSampleData = () => {
    setFormData({
      instrument: 'Piano',
      skill_level: 'Beginner',
      topic: 'Basic chord progressions and finger placement for popular songs'
    });
    setError('');
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormData({ instrument: '', skill_level: 'Beginner', topic: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      instrument: lesson.instrument,
      skill_level: lesson.skill_level,
      topic: lesson.topic
    });
    setShowModal(true);
    setError('');
  };

  const parseAIResponse = (lesson) => {
    if (lesson.ai_response) {
      try {
        return typeof lesson.ai_response === 'string'
          ? JSON.parse(lesson.ai_response)
          : lesson.ai_response;
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
        <p>Loading music lessons...</p>
      </div>
    );
  }

  if (selectedLesson) {
    const aiData = parseAIResponse(selectedLesson);

    return (
      <div className="feature-page">
        <div className="page-header music">
          <div className="container">
            <button className="btn btn-secondary" onClick={() => setSelectedLesson(null)}>
              <FiArrowLeft /> Back to Lessons
            </button>
          </div>
        </div>

        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{selectedLesson.topic}</h1>
                <div className="detail-meta">
                  <span className="badge badge-primary">{selectedLesson.instrument}</span>
                  <span className="badge badge-info">{selectedLesson.skill_level}</span>
                  <span>Created: {new Date(selectedLesson.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRegenerate(selectedLesson.id)}
                  disabled={actionLoading}
                >
                  <FiRefreshCw /> Regenerate
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(selectedLesson)}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedLesson.id)}
                  disabled={actionLoading}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              {aiData && (
                <AIResponseDisplay data={aiData} type="music" />
              )}

              {!aiData && selectedLesson.lesson_content && (
                <div className="detail-section">
                  <h3>Lesson Content</h3>
                  <p>{selectedLesson.lesson_content}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header music">
        <div className="container">
          <h1><FiMusic /> AI Music Teacher</h1>
          <p>Learn instruments with personalized AI-generated lessons</p>
        </div>
      </div>

      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{lessons.length} lessons</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> New Lesson
            </button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎵</div>
            <h3>No music lessons yet</h3>
            <p>Create your first personalized music lesson</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Create Lesson
            </button>
          </div>
        ) : (
          <div className="data-list">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="data-list-item"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{lesson.topic}</div>
                  <div className="data-list-item-meta">
                    {lesson.instrument} • {lesson.skill_level} • {new Date(lesson.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(lesson)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(lesson.id)}
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
        title={editingLesson ? 'Edit Music Lesson' : 'Create New Music Lesson'}
        size="medium"
      >
        <form onSubmit={editingLesson ? handleUpdate : handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}

          {!editingLesson && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadSampleData}>
                <FiDownload /> Load Sample Data
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Instrument</label>
            <select
              className="form-select"
              value={formData.instrument}
              onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
              required
            >
              <option value="">Select an instrument</option>
              {instruments.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Skill Level</label>
            <select
              className="form-select"
              value={formData.skill_level}
              onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
              required
            >
              {skillLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Lesson Topic</label>
            <input
              type="text"
              className="form-input"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Basic chord progressions, Scales, Rhythm patterns"
              required
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
                  {editingLesson ? 'Updating...' : 'Generating...'}
                </>
              ) : (
                editingLesson ? 'Update Lesson' : 'Generate Lesson'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Music;
