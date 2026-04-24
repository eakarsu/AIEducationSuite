import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiArrowLeft, FiBook, FiDownload } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import './FeaturePage.css';

function Reading() {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await api.reading.getAll();
      setAnalyses(data);
    } catch (err) {
      setError('Failed to load reading analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.reading.create(formData);
      setAnalyses([result.analysis, ...analyses]);
      setShowModal(false);
      setFormData({ title: '', content: '' });
      if (result.analysis) {
        setSelectedAnalysis(result.analysis);
      }
    } catch (err) {
      setError(err.message || 'Failed to create analysis');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.reading.update(editingAnalysis.id, formData);
      setAnalyses(analyses.map(a => a.id === editingAnalysis.id ? result.analysis : a));
      setShowModal(false);
      setEditingAnalysis(null);
      setFormData({ title: '', content: '' });
      if (result.analysis) {
        setSelectedAnalysis(result.analysis);
      }
    } catch (err) {
      setError(err.message || 'Failed to update analysis');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    setActionLoading(true);
    try {
      await api.reading.delete(id);
      setAnalyses(analyses.filter(a => a.id !== id));
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete analysis');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReanalyze = async (id) => {
    setActionLoading(true);
    try {
      const result = await api.reading.reanalyze(id);
      setAnalyses(analyses.map(a => a.id === id ? result.analysis : a));
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(result.analysis);
      }
    } catch (err) {
      setError(err.message || 'Failed to reanalyze');
    } finally {
      setActionLoading(false);
    }
  };

  const loadSampleData = () => {
    setFormData({
      title: 'Scientific Article: Quantum Computing Basics',
      content: `Quantum computing represents a fundamental paradigm shift in computational methodology, leveraging the principles of quantum mechanics to process information in ways that classical computers cannot. Unlike classical bits, which exist in a definitive state of either 0 or 1, quantum bits, or qubits, can exist in a superposition of both states simultaneously. This property, combined with quantum entanglement and interference, enables quantum computers to perform certain calculations exponentially faster than their classical counterparts.

The theoretical foundation of quantum computing was established by physicist Richard Feynman in 1982, who proposed that quantum systems could be efficiently simulated only by other quantum systems. Subsequently, Peter Shor developed an algorithm in 1994 demonstrating that a sufficiently powerful quantum computer could factor large integers in polynomial time, potentially rendering current cryptographic systems obsolete.

Contemporary quantum processors utilize various physical implementations, including superconducting circuits, trapped ions, and photonic systems. Each approach presents distinct advantages and engineering challenges related to coherence times, gate fidelities, and scalability. The phenomenon of decoherence, wherein quantum states lose their quantum properties through interaction with the environment, remains one of the most significant obstacles to building practical, large-scale quantum computers.`
    });
    setError('');
  };

  const openCreateModal = () => {
    setEditingAnalysis(null);
    setFormData({ title: '', content: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (analysis) => {
    setEditingAnalysis(analysis);
    setFormData({ title: analysis.title, content: analysis.content });
    setShowModal(true);
    setError('');
  };

  const parseAIResponse = (analysis) => {
    if (analysis.ai_response) {
      try {
        return typeof analysis.ai_response === 'string'
          ? JSON.parse(analysis.ai_response)
          : analysis.ai_response;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getDifficultyColor = (score) => {
    if (!score) return 'badge-primary';
    if (score <= 30) return 'badge-success';
    if (score <= 60) return 'badge-warning';
    return 'badge-danger';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reading analyses...</p>
      </div>
    );
  }

  if (selectedAnalysis) {
    const aiData = parseAIResponse(selectedAnalysis);

    return (
      <div className="feature-page">
        <div className="page-header reading">
          <div className="container">
            <button className="btn btn-secondary" onClick={() => setSelectedAnalysis(null)}>
              <FiArrowLeft /> Back to Analyses
            </button>
          </div>
        </div>

        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{selectedAnalysis.title}</h1>
                <div className="detail-meta">
                  {selectedAnalysis.reading_level && (
                    <span className="badge badge-primary">{selectedAnalysis.reading_level}</span>
                  )}
                  {selectedAnalysis.grade_level && (
                    <span className="badge badge-info">{selectedAnalysis.grade_level}</span>
                  )}
                  {selectedAnalysis.difficulty_score && (
                    <span className={`badge ${getDifficultyColor(selectedAnalysis.difficulty_score)}`}>
                      Difficulty: {selectedAnalysis.difficulty_score}/100
                    </span>
                  )}
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleReanalyze(selectedAnalysis.id)}
                  disabled={actionLoading}
                >
                  <FiRefreshCw /> Reanalyze
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(selectedAnalysis)}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedAnalysis.id)}
                  disabled={actionLoading}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h3>Analyzed Content</h3>
                <div className="content-box">
                  <p>{selectedAnalysis.content}</p>
                </div>
              </div>

              {aiData && (
                <AIResponseDisplay data={aiData} type="reading" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header reading">
        <div className="container">
          <h1><FiBook /> AI Reading Level Analyzer</h1>
          <p>Analyze text complexity and get content recommendations</p>
        </div>
      </div>

      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{analyses.length} analyses</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Analyze Text
            </button>
          </div>
        </div>

        {analyses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h3>No reading analyses yet</h3>
            <p>Submit text to analyze its reading level</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Analyze Text
            </button>
          </div>
        ) : (
          <div className="data-list">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="data-list-item"
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{analysis.title}</div>
                  <div className="data-list-item-meta">
                    {analysis.reading_level && `${analysis.reading_level} • `}
                    {analysis.grade_level && `${analysis.grade_level} • `}
                    {analysis.difficulty_score && `Difficulty: ${analysis.difficulty_score}/100`}
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(analysis)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(analysis.id)}
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
        title={editingAnalysis ? 'Edit Analysis' : 'Analyze New Text'}
        size="large"
      >
        <form onSubmit={editingAnalysis ? handleUpdate : handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}

          {!editingAnalysis && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadSampleData}>
                <FiDownload /> Load Sample Data
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Title / Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Article about Climate Change"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Text Content</label>
            <textarea
              className="form-textarea"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Paste the text you want to analyze..."
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
                  {editingAnalysis ? 'Updating...' : 'Analyzing...'}
                </>
              ) : (
                editingAnalysis ? 'Update Analysis' : 'Analyze Text'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Reading;
