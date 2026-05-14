import React, { useState } from 'react';
import { FiZap, FiCalendar, FiBarChart2, FiUsers, FiHelpCircle, FiTrendingUp } from 'react-icons/fi';
import './FeaturePage.css';

const TOOLS = [
  { id: 'essay-improvement', label: 'Essay Improvement', icon: <FiZap /> },
  { id: 'study-planner', label: 'Study Planner', icon: <FiCalendar /> },
  { id: 'cohort-analytics', label: 'Cohort Analytics', icon: <FiBarChart2 /> },
  { id: 'teacher-cohort-report', label: 'Teacher Cohort Report', icon: <FiUsers /> },
  { id: 'quiz-generation', label: 'Quiz Generation', icon: <FiHelpCircle /> },
  { id: 'learning-path-recommend', label: 'Next-Lesson Recommender', icon: <FiTrendingUp /> }
];

async function callAI(path, body) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/ai/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }
  if (res.status === 503) {
    throw new Error('AI not configured: OPENROUTER_API_KEY missing on server.');
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function AITools() {
  const [activeTool, setActiveTool] = useState('essay-improvement');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Per-tool form states
  const [essayId, setEssayId] = useState('');
  const [planForm, setPlanForm] = useState({ learning_path_id: '', target_date: '' });
  const [cohortForm, setCohortForm] = useState({ start: '', end: '' });
  const [teacherForm, setTeacherForm] = useState({ start: '', end: '' });
  const [quizForm, setQuizForm] = useState({ topic: '', subject: '', difficulty: 'medium', num_questions: 5, source_content: '' });
  const [recForm, setRecForm] = useState({ subject: '', max_recommendations: 5 });

  const run = async (path, body) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await callAI(path, body);
      setResult(r);
    } catch (err) {
      setError(err.message || 'AI error');
    } finally {
      setLoading(false);
    }
  };

  const switchTool = (id) => {
    setActiveTool(id); setResult(null); setError('');
  };

  return (
    <div className="feature-page">
      <div className="page-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <h1><FiZap /> AI Tools</h1>
          <p>Advanced AI features for educators and students</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTool(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #e2e8f0',
                background: activeTool === t.id ? '#667eea' : 'white',
                color: activeTool === t.id ? 'white' : '#334155',
                fontWeight: 600, fontSize: 14
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem' }}>
          {activeTool === 'essay-improvement' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Essay Improvement</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Generate an improved version of an existing essay with tracked changes. Requires the essay's numeric ID.</p>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Essay ID</label>
                <input
                  type="number"
                  value={essayId}
                  onChange={e => setEssayId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  placeholder="e.g. 12"
                />
              </div>
              <button
                disabled={loading || !essayId}
                onClick={() => run('essay-improvement', { essay_id: Number(essayId) })}
                style={{ padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Generating...' : 'Generate Improvement'}
              </button>
            </div>
          )}

          {activeTool === 'study-planner' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Study Planner</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Generate a week-by-week study calendar from a learning path.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Learning Path ID</label>
                  <input type="number" value={planForm.learning_path_id} onChange={e => setPlanForm({ ...planForm, learning_path_id: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} placeholder="e.g. 5" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Target Date</label>
                  <input type="date" value={planForm.target_date} onChange={e => setPlanForm({ ...planForm, target_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
              </div>
              <button
                disabled={loading || !planForm.learning_path_id || !planForm.target_date}
                onClick={() => run('study-planner', { learning_path_id: Number(planForm.learning_path_id), target_date: planForm.target_date })}
                style={{ padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Planning...' : 'Generate Study Plan'}
              </button>
            </div>
          )}

          {activeTool === 'cohort-analytics' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Cohort Analytics</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Class health summary across essays + quizzes for a date range.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Start Date</label>
                  <input type="date" value={cohortForm.start} onChange={e => setCohortForm({ ...cohortForm, start: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>End Date</label>
                  <input type="date" value={cohortForm.end} onChange={e => setCohortForm({ ...cohortForm, end: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
              </div>
              <button
                disabled={loading || !cohortForm.start || !cohortForm.end}
                onClick={() => run('cohort-analytics', { date_range: { start: cohortForm.start, end: cohortForm.end } })}
                style={{ padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Analyzing...' : 'Run Analytics'}
              </button>
            </div>
          )}

          {activeTool === 'teacher-cohort-report' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Teacher Cohort Report</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Detailed teacher dashboard with at-risk-student flags.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Start Date</label>
                  <input type="date" value={teacherForm.start} onChange={e => setTeacherForm({ ...teacherForm, start: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>End Date</label>
                  <input type="date" value={teacherForm.end} onChange={e => setTeacherForm({ ...teacherForm, end: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
              </div>
              <button
                disabled={loading || !teacherForm.start || !teacherForm.end}
                onClick={() => run('teacher-cohort-report', { date_range: { start: teacherForm.start, end: teacherForm.end } })}
                style={{ padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          )}

          {activeTool === 'quiz-generation' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Quiz Generation</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Generate a quiz on any topic with chosen difficulty and question count. Optionally paste source material to ground the questions.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Topic *</label>
                  <input type="text" value={quizForm.topic} onChange={e => setQuizForm({ ...quizForm, topic: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} placeholder="e.g. Photosynthesis" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Subject</label>
                  <input type="text" value={quizForm.subject} onChange={e => setQuizForm({ ...quizForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} placeholder="Biology" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Difficulty</label>
                  <select value={quizForm.difficulty} onChange={e => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                    {['easy', 'medium', 'hard', 'expert'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Number of Questions</label>
                  <input type="number" min={1} max={25} value={quizForm.num_questions} onChange={e => setQuizForm({ ...quizForm, num_questions: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Source Content (optional)</label>
                <textarea rows={4} value={quizForm.source_content} onChange={e => setQuizForm({ ...quizForm, source_content: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} placeholder="Paste a textbook excerpt or article..." />
              </div>
              <button
                disabled={loading || !quizForm.topic}
                onClick={() => run('quiz-generation', {
                  topic: quizForm.topic,
                  subject: quizForm.subject || quizForm.topic,
                  difficulty: quizForm.difficulty,
                  num_questions: Number(quizForm.num_questions),
                  source_content: quizForm.source_content || undefined
                })}
                style={{ padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Generating...' : 'Generate Quiz'}
              </button>
            </div>
          )}

          {activeTool === 'learning-path-recommend' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Next-Lesson Recommender</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Reads your quiz attempts, recent essays, and active learning paths to recommend the next lessons with rationale.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Subject (optional)</label>
                  <input type="text" value={recForm.subject} onChange={e => setRecForm({ ...recForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} placeholder="leave blank for any" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Max Recommendations</label>
                  <input type="number" min={1} max={15} value={recForm.max_recommendations} onChange={e => setRecForm({ ...recForm, max_recommendations: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                </div>
              </div>
              <button
                disabled={loading}
                onClick={() => run('learning-path-recommend', {
                  subject: recForm.subject || undefined,
                  max_recommendations: Number(recForm.max_recommendations)
                })}
                style={{ padding: '0.6rem 1.2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Analyzing...' : 'Recommend Next Lessons'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 6, fontSize: 14 }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Result</h3>
              <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '1rem', borderRadius: 8, fontSize: 12, overflow: 'auto', maxHeight: 500 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AITools;
