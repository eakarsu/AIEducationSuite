import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiArrowLeft, FiHelpCircle, FiDownload } from 'react-icons/fi';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import './FeaturePage.css';

function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    difficulty: 'Medium',
    source_content: '',
    num_questions: 10
  });
  const [error, setError] = useState('');

  const subjects = ['History', 'Science', 'Mathematics', 'Literature', 'Geography', 'Art', 'Music', 'Technology', 'Psychology', 'Economics', 'Language', 'Philosophy'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await api.quizzes.getAll();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.quizzes.create(formData);
      setQuizzes([result.quiz, ...quizzes]);
      setShowModal(false);
      setFormData({ title: '', subject: '', difficulty: 'Medium', source_content: '', num_questions: 10 });
      if (result.quiz) {
        setSelectedQuiz(result.quiz);
      }
    } catch (err) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const result = await api.quizzes.update(editingQuiz.id, formData);
      setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? result.quiz : q));
      setShowModal(false);
      setEditingQuiz(null);
      setFormData({ title: '', subject: '', difficulty: 'Medium', source_content: '', num_questions: 10 });
      if (result.quiz) {
        setSelectedQuiz(result.quiz);
      }
    } catch (err) {
      setError(err.message || 'Failed to update quiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    setActionLoading(true);
    try {
      await api.quizzes.delete(id);
      setQuizzes(quizzes.filter(q => q.id !== id));
      if (selectedQuiz?.id === id) {
        setSelectedQuiz(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete quiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async (id) => {
    setActionLoading(true);
    try {
      const result = await api.quizzes.regenerate(id);
      setQuizzes(quizzes.map(q => q.id === id ? result.quiz : q));
      if (selectedQuiz?.id === id) {
        setSelectedQuiz(result.quiz);
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate quiz');
    } finally {
      setActionLoading(false);
    }
  };

  const loadSampleData = () => {
    setFormData({
      title: 'World War II: Key Events and Turning Points',
      subject: 'History',
      difficulty: 'Medium',
      num_questions: 10,
      source_content: 'World War II lasted from 1939 to 1945 and involved most of the world\'s nations. Key events include the invasion of Poland, the Battle of Britain, the attack on Pearl Harbor, D-Day, the Battle of Stalingrad, and the atomic bombings of Hiroshima and Nagasaki. The war resulted in an estimated 70-85 million deaths and led to the creation of the United Nations.'
    });
    setError('');
  };

  const openCreateModal = () => {
    setEditingQuiz(null);
    setFormData({ title: '', subject: '', difficulty: 'Medium', source_content: '', num_questions: 10 });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      source_content: quiz.source_content || '',
      num_questions: quiz.num_questions || 10
    });
    setShowModal(true);
    setError('');
  };

  const parseAIResponse = (quiz) => {
    if (quiz.ai_response) {
      try {
        return typeof quiz.ai_response === 'string'
          ? JSON.parse(quiz.ai_response)
          : quiz.ai_response;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading quizzes...</p>
      </div>
    );
  }

  if (selectedQuiz) {
    const aiData = parseAIResponse(selectedQuiz);

    return (
      <div className="feature-page">
        <div className="page-header quiz">
          <div className="container">
            <button className="btn btn-secondary" onClick={() => setSelectedQuiz(null)}>
              <FiArrowLeft /> Back to Quizzes
            </button>
          </div>
        </div>

        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{selectedQuiz.title}</h1>
                <div className="detail-meta">
                  <span className="badge badge-primary">{selectedQuiz.subject}</span>
                  <span className={`badge ${getDifficultyClass(selectedQuiz.difficulty)}`}>
                    {selectedQuiz.difficulty}
                  </span>
                  <span>{selectedQuiz.num_questions} questions</span>
                </div>
              </div>
              <div className="detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRegenerate(selectedQuiz.id)}
                  disabled={actionLoading}
                >
                  <FiRefreshCw /> Regenerate
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => openEditModal(selectedQuiz)}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedQuiz.id)}
                  disabled={actionLoading}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>

            <div className="detail-content">
              {aiData && (
                <AIResponseDisplay data={aiData} type="quiz" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header quiz">
        <div className="container">
          <h1><FiHelpCircle /> AI Quiz Maker</h1>
          <p>Generate custom quizzes from any content for effective learning</p>
        </div>
      </div>

      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{quizzes.length} quizzes</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> New Quiz
            </button>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <h3>No quizzes yet</h3>
            <p>Create your first AI-generated quiz</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Create Quiz
            </button>
          </div>
        ) : (
          <div className="data-list">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="data-list-item"
                onClick={() => setSelectedQuiz(quiz)}
              >
                <div className="data-list-item-content">
                  <div className="data-list-item-title">{quiz.title}</div>
                  <div className="data-list-item-meta">
                    {quiz.subject} • {quiz.difficulty} • {quiz.num_questions} questions
                  </div>
                </div>
                <div className="data-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(quiz)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(quiz.id)}
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
        title={editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
        size="large"
      >
        <form onSubmit={editingQuiz ? handleUpdate : handleCreate}>
          {error && <div className="alert alert-error">{error}</div>}

          {!editingQuiz && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadSampleData}>
                <FiDownload /> Load Sample Data
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Quiz Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., World History: Ancient Civilizations"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject</label>
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
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                required
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Questions</label>
              <input
                type="number"
                className="form-input"
                value={formData.num_questions}
                onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) || 10 })}
                min="5"
                max="30"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Source Content (Optional)</label>
            <textarea
              className="form-textarea"
              value={formData.source_content}
              onChange={(e) => setFormData({ ...formData, source_content: e.target.value })}
              placeholder="Paste content to generate questions from, or leave empty for general knowledge questions..."
              rows={6}
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
                  {editingQuiz ? 'Updating...' : 'Generating...'}
                </>
              ) : (
                editingQuiz ? 'Update Quiz' : 'Generate Quiz'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Quizzes;
