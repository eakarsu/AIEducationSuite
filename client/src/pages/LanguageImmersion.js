import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiArrowLeft, FiGlobe, FiDownload } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import './FeaturePage.css';

const LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese',
  'Korean', 'Mandarin Chinese', 'Arabic', 'Russian', 'Hindi', 'Turkish',
  'Dutch', 'Swedish', 'Polish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Swahili'
];

const PROFICIENCY_LEVELS = ['Beginner (A1)', 'Elementary (A2)', 'Intermediate (B1)', 'Upper Intermediate (B2)', 'Advanced (C1)', 'Mastery (C2)'];

const SESSION_TYPES = [
  { value: 'conversation', label: 'Conversation Practice' },
  { value: 'vocabulary', label: 'Vocabulary Builder' },
  { value: 'grammar', label: 'Grammar Lesson' },
  { value: 'reading', label: 'Reading Comprehension' },
  { value: 'culture', label: 'Cultural Immersion' },
  { value: 'travel', label: 'Travel Phrases' },
  { value: 'business', label: 'Business Language' }
];

function LanguageImmersion() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    target_language: 'Spanish',
    native_language: 'English',
    proficiency_level: 'Beginner (A1)',
    topic: '',
    session_type: 'conversation'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.language.getAll();
      setSessions(data);
    } catch (err) {
      setError('Failed to load language sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.language.create(formData);
      setSessions([result.session, ...sessions]);
      setShowModal(false);
      setFormData({ target_language: 'Spanish', native_language: 'English', proficiency_level: 'Beginner (A1)', topic: '', session_type: 'conversation' });
      if (result.session) {
        setSelectedSession(result.session);
      }
    } catch (err) {
      setError(err.message || 'Failed to create language session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.language.update(editingSession.id, formData);
      setSessions(sessions.map(s => s.id === editingSession.id ? result.session : s));
      setShowModal(false);
      setEditingSession(null);
      setFormData({ target_language: 'Spanish', native_language: 'English', proficiency_level: 'Beginner (A1)', topic: '', session_type: 'conversation' });
      if (result.session) {
        setSelectedSession(result.session);
      }
    } catch (err) {
      setError(err.message || 'Failed to update language session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this language session?')) return;

    setActionLoading(true);
    try {
      await api.language.delete(id);
      setSessions(sessions.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete language session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async (id) => {
    setActionLoading(true);
    try {
      const result = await api.language.regenerate(id);
      setSessions(sessions.map(s => s.id === id ? result.session : s));
      if (selectedSession?.id === id) {
        setSelectedSession(result.session);
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate language session');
    } finally {
      setActionLoading(false);
    }
  };

  const loadSampleData = () => {
    setFormData({
      target_language: 'Spanish',
      native_language: 'English',
      proficiency_level: 'Intermediate (B1)',
      topic: 'Ordering food at a restaurant and discussing local cuisine',
      session_type: 'conversation'
    });
    setError('');
  };

  const openCreateModal = () => {
    setEditingSession(null);
    setFormData({ target_language: 'Spanish', native_language: 'English', proficiency_level: 'Beginner (A1)', topic: '', session_type: 'conversation' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (session) => {
    setEditingSession(session);
    setFormData({
      target_language: session.target_language,
      native_language: session.native_language,
      proficiency_level: session.proficiency_level,
      topic: session.topic,
      session_type: session.session_type
    });
    setShowModal(true);
    setError('');
  };

  const parseAIResponse = (session) => {
    if (session.ai_response) {
      try {
        return typeof session.ai_response === 'string'
          ? JSON.parse(session.ai_response)
          : session.ai_response;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getSessionTypeLabel = (value) => {
    const found = SESSION_TYPES.find(t => t.value === value);
    return found ? found.label : value;
  };

  const parseJsonField = (field) => {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading language sessions...</p>
      </div>
    );
  }

  if (selectedSession) {
    const aiData = parseAIResponse(selectedSession);
    const vocabData = parseJsonField(selectedSession.vocabulary);
    const exercisesData = parseJsonField(selectedSession.exercises);

    return (
      <div className="feature-page">
        <div className="page-header">
          <div className="container">
            <button className="btn btn-secondary" onClick={() => setSelectedSession(null)}>
              <FiArrowLeft /> Back to Sessions
            </button>
          </div>
        </div>

        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{selectedSession.topic}</h1>
                <div className="detail-meta">
                  <span className="badge badge-primary">{selectedSession.target_language}</span>
                  <span className="badge">{selectedSession.proficiency_level}</span>
                  <span className="badge">{getSessionTypeLabel(selectedSession.session_type)}</span>
                  <span>Created: {new Date(selectedSession.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRegenerate(selectedSession.id)}
                  disabled={actionLoading}
                >
                  <FiRefreshCw /> Regenerate
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(selectedSession)}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedSession.id)}
                  disabled={actionLoading}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              {selectedSession.lesson_content && (
                <div className="detail-section">
                  <h3>Lesson Content</h3>
                  <div className="content-box">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedSession.lesson_content}</p>
                  </div>
                </div>
              )}

              {vocabData && Array.isArray(vocabData) && vocabData.length > 0 && (
                <div className="detail-section">
                  <h3>Vocabulary</h3>
                  <div className="content-box">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>{selectedSession.target_language}</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>{selectedSession.native_language}</th>
                          {vocabData[0]?.pronunciation && (
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>Pronunciation</th>
                          )}
                          {vocabData[0]?.example && (
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>Example</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {vocabData.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontWeight: '600' }}>
                              {item.word || item.phrase || item.term || (typeof item === 'string' ? item : JSON.stringify(item))}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                              {item.translation || item.meaning || ''}
                            </td>
                            {vocabData[0]?.pronunciation && (
                              <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontStyle: 'italic' }}>
                                {item.pronunciation || ''}
                              </td>
                            )}
                            {vocabData[0]?.example && (
                              <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontStyle: 'italic' }}>
                                {item.example || ''}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedSession.grammar_notes && (
                <div className="detail-section">
                  <h3>Grammar Notes</h3>
                  <div className="content-box">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedSession.grammar_notes}</p>
                  </div>
                </div>
              )}

              {exercisesData && Array.isArray(exercisesData) && exercisesData.length > 0 && (
                <div className="detail-section">
                  <h3>Practice Exercises</h3>
                  <div className="content-box">
                    {exercisesData.map((exercise, idx) => (
                      <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: idx < exercisesData.length - 1 ? '1px solid var(--border-color, #e2e8f0)' : 'none' }}>
                        <strong>Exercise {idx + 1}: {exercise.type || exercise.title || ''}</strong>
                        <p style={{ margin: '0.5rem 0' }}>{exercise.instruction || exercise.description || exercise.question || ''}</p>
                        {exercise.answer && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary style={{ cursor: 'pointer', color: 'var(--primary-color, #4f46e5)' }}>Show Answer</summary>
                            <p style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '4px' }}>{exercise.answer}</p>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSession.pronunciation_guide && (
                <div className="detail-section">
                  <h3>Pronunciation Guide</h3>
                  <div className="content-box">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedSession.pronunciation_guide}</p>
                  </div>
                </div>
              )}

              {selectedSession.cultural_notes && (
                <div className="detail-section">
                  <h3>Cultural Notes</h3>
                  <div className="content-box">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedSession.cultural_notes}</p>
                  </div>
                </div>
              )}

              {aiData && (
                <AIResponseDisplay data={aiData} type="language" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header">
        <div className="container">
          <h1><FiGlobe /> AI Language Immersion</h1>
          <p>Learn any language with AI-powered immersive lessons, vocabulary, and conversation practice</p>
        </div>
      </div>

      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{sessions.length} sessions</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> New Session
            </button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌍</div>
            <h3>No language sessions yet</h3>
            <p>Start your language learning journey with an AI-powered immersive session</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Start Learning
            </button>
          </div>
        ) : (
          <div className="data-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="data-list-item"
                onClick={() => setSelectedSession(session)}
              >
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{session.topic}</div>
                  <div className="data-list-item-meta">
                    {new Date(session.created_at).toLocaleDateString()}
                    {` \u2022 ${session.target_language}`}
                    {` \u2022 ${session.proficiency_level}`}
                    {` \u2022 ${getSessionTypeLabel(session.session_type)}`}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(session)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(session.id)}
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
        title={editingSession ? 'Edit Language Session' : 'New Language Session'}
        size="large"
      >
        <form onSubmit={editingSession ? handleUpdate : handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}

          {!editingSession && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadSampleData}>
                <FiDownload /> Load Sample Data
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Target Language</label>
            <select
              className="form-input"
              value={formData.target_language}
              onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
              required
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Your Native Language</label>
            <input
              type="text"
              className="form-input"
              value={formData.native_language}
              onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
              placeholder="English"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Proficiency Level</label>
            <select
              className="form-input"
              value={formData.proficiency_level}
              onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
              required
            >
              {PROFICIENCY_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Session Type</label>
            <select
              className="form-input"
              value={formData.session_type}
              onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
            >
              {SESSION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Topic / Scenario</label>
            <textarea
              className="form-textarea"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Describe what you want to learn, e.g., 'Ordering food at a restaurant', 'Job interview preparation', 'Discussing hobbies and interests'..."
              rows={3}
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
                  {editingSession ? 'Updating...' : 'Generating...'}
                </>
              ) : (
                editingSession ? 'Update Session' : 'Generate Lesson'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LanguageImmersion;
