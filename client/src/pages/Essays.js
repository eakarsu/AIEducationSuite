import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiArrowLeft, FiFileText, FiDownload } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import './FeaturePage.css';

function Essays() {
  const [essays, setEssays] = useState([]);
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEssay, setEditingEssay] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadEssays();
  }, []);

  const loadEssays = async () => {
    try {
      const data = await api.essays.getAll();
      setEssays(data);
    } catch (err) {
      setError('Failed to load essays');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.essays.create(formData);
      setEssays([result.essay, ...essays]);
      setShowModal(false);
      setFormData({ title: '', content: '' });
      if (result.essay) {
        setSelectedEssay(result.essay);
      }
    } catch (err) {
      setError(err.message || 'Failed to create essay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.essays.update(editingEssay.id, formData);
      setEssays(essays.map(e => e.id === editingEssay.id ? result.essay : e));
      setShowModal(false);
      setEditingEssay(null);
      setFormData({ title: '', content: '' });
      if (result.essay) {
        setSelectedEssay(result.essay);
      }
    } catch (err) {
      setError(err.message || 'Failed to update essay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this essay?')) return;

    setActionLoading(true);
    try {
      await api.essays.delete(id);
      setEssays(essays.filter(e => e.id !== id));
      if (selectedEssay?.id === id) {
        setSelectedEssay(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete essay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegrade = async (id) => {
    setActionLoading(true);
    try {
      const result = await api.essays.regrade(id);
      setEssays(essays.map(e => e.id === id ? result.essay : e));
      if (selectedEssay?.id === id) {
        setSelectedEssay(result.essay);
      }
    } catch (err) {
      setError(err.message || 'Failed to regrade essay');
    } finally {
      setActionLoading(false);
    }
  };

  const [originalityResult, setOriginalityResult] = useState(null);
  const handleOriginalityCheck = async (id) => {
    setActionLoading(true);
    setOriginalityResult(null);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/ai/essays/${id}/originality`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Originality check failed');
      setOriginalityResult(data.originality);
    } catch (err) {
      setError(err.message || 'Failed originality check');
    } finally {
      setActionLoading(false);
    }
  };

  const loadSampleData = () => {
    setFormData({
      title: 'The Impact of Artificial Intelligence on Modern Education',
      content: `Artificial intelligence has rapidly transformed numerous sectors of society, and education is no exception. Over the past decade, AI-powered tools have begun reshaping how students learn, how teachers teach, and how educational institutions operate. This essay explores the multifaceted impact of AI on modern education, examining both its promising benefits and potential challenges.

One of the most significant contributions of AI to education is the ability to personalize learning experiences. Traditional classroom settings often follow a one-size-fits-all approach, where students with varying abilities and learning styles receive the same instruction. AI-powered adaptive learning platforms, such as Khan Academy and Duolingo, analyze individual student performance in real time and adjust the difficulty and type of content accordingly. This personalization ensures that advanced students are challenged while struggling students receive additional support, ultimately leading to more effective learning outcomes.

Furthermore, AI has revolutionized assessment and feedback mechanisms. Automated grading systems can evaluate multiple-choice tests, essays, and even complex mathematical proofs with remarkable accuracy. These systems provide instant feedback to students, allowing them to identify and address their weaknesses immediately rather than waiting days or weeks for teacher evaluations. For educators, this automation frees up valuable time that can be redirected toward more meaningful interactions with students.

However, the integration of AI in education is not without its challenges. Privacy concerns arise as AI systems collect vast amounts of student data to function effectively. Questions about data security, consent, and the potential misuse of personal information remain largely unresolved. Additionally, there is a growing concern about the digital divide, as students from underprivileged backgrounds may lack access to the technology required to benefit from AI-enhanced education.

In conclusion, while AI holds tremendous potential to improve educational outcomes through personalization, efficient assessment, and innovative teaching tools, it is crucial that stakeholders address the accompanying ethical and accessibility challenges. The future of AI in education depends on our ability to harness its power responsibly while ensuring equitable access for all learners.`
    });
    setError('');
  };

  const openCreateModal = () => {
    setEditingEssay(null);
    setFormData({ title: '', content: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (essay) => {
    setEditingEssay(essay);
    setFormData({ title: essay.title, content: essay.content });
    setShowModal(true);
    setError('');
  };

  const parseAIResponse = (essay) => {
    if (essay.ai_response) {
      try {
        return typeof essay.ai_response === 'string'
          ? JSON.parse(essay.ai_response)
          : essay.ai_response;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getGradeClass = (grade) => {
    if (!grade) return '';
    const letter = grade.charAt(0).toUpperCase();
    return `grade-${letter.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading essays...</p>
      </div>
    );
  }

  if (selectedEssay) {
    const aiData = parseAIResponse(selectedEssay);

    return (
      <div className="feature-page">
        <div className="page-header">
          <div className="container">
            <button className="btn btn-secondary" onClick={() => setSelectedEssay(null)}>
              <FiArrowLeft /> Back to Essays
            </button>
          </div>
        </div>

        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{selectedEssay.title}</h1>
                <div className="detail-meta">
                  <span>Created: {new Date(selectedEssay.created_at).toLocaleDateString()}</span>
                  {selectedEssay.grade && (
                    <span className={`badge ${getGradeClass(selectedEssay.grade)}`}>
                      Grade: {selectedEssay.grade}
                    </span>
                  )}
                  {selectedEssay.score && (
                    <span className="badge badge-primary">Score: {selectedEssay.score}/100</span>
                  )}
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRegrade(selectedEssay.id)}
                  disabled={actionLoading}
                >
                  <FiRefreshCw /> Regrade
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOriginalityCheck(selectedEssay.id)}
                  disabled={actionLoading}
                  title="Plagiarism + AI-content detection"
                >
                  Originality Check
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(selectedEssay)}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedEssay.id)}
                  disabled={actionLoading}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h3>Essay Content</h3>
                <div className="content-box">
                  <p>{selectedEssay.content}</p>
                </div>
              </div>

              {aiData && (
                <AIResponseDisplay data={aiData} type="essay" />
              )}

              {!aiData && selectedEssay.feedback && (
                <div className="detail-section">
                  <h3>Feedback</h3>
                  <p>{selectedEssay.feedback}</p>
                </div>
              )}

              {originalityResult && (
                <div className="detail-section" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 16, background: '#f9fafb' }}>
                  <h3>Originality Check</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                    <div><strong>Originality:</strong> {originalityResult.originality_score}/100</div>
                    <div><strong>AI-Generated Likelihood:</strong> {originalityResult.likelihood_of_ai_generated}/100</div>
                    <div><strong>Verdict:</strong> {originalityResult.verdict}</div>
                    <div><strong>Confidence:</strong> {originalityResult.confidence}/100</div>
                    <div><strong>Voice Consistency:</strong> {originalityResult.voice_consistency}</div>
                    <div><strong>Suggested Action:</strong> {originalityResult.teacher_recommended_action}</div>
                  </div>
                  {originalityResult.ai_indicators?.length > 0 && (
                    <div><strong>AI Indicators:</strong>
                      <ul>{originalityResult.ai_indicators.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    </div>
                  )}
                  {originalityResult.stylistic_red_flags?.length > 0 && (
                    <div><strong>Red Flags:</strong>
                      <ul>{originalityResult.stylistic_red_flags.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    </div>
                  )}
                  <p style={{ marginTop: 8 }}>{originalityResult.explanation}</p>
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
      <div className="page-header">
        <div className="container">
          <h1><FiFileText /> AI Essay Grader</h1>
          <p>Submit your essays for AI-powered grading and feedback</p>
        </div>
      </div>

      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{essays.length} essays</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> New Essay
            </button>
          </div>
        </div>

        {essays.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No essays yet</h3>
            <p>Submit your first essay to get AI-powered grading and feedback</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Submit Essay
            </button>
          </div>
        ) : (
          <div className="data-list">
            {essays.map((essay) => (
              <div
                key={essay.id}
                className="data-list-item"
                onClick={() => setSelectedEssay(essay)}
              >
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{essay.title}</div>
                  <div className="data-list-item-meta">
                    {new Date(essay.created_at).toLocaleDateString()}
                    {essay.grade && ` • Grade: ${essay.grade}`}
                    {essay.score && ` • Score: ${essay.score}/100`}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(essay)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(essay.id)}
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
        title={editingEssay ? 'Edit Essay' : 'Submit New Essay'}
        size="large"
      >
        <form onSubmit={editingEssay ? handleUpdate : handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}

          {!editingEssay && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadSampleData}>
                <FiDownload /> Load Sample Data
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Essay Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter essay title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Essay Content</label>
            <textarea
              className="form-textarea"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Paste or type your essay content here..."
              rows={12}
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
                  {editingEssay ? 'Updating...' : 'Grading...'}
                </>
              ) : (
                editingEssay ? 'Update Essay' : 'Submit & Grade'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Essays;
