// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated frontend page (lean v0). Wires Custom Feature Suggestions
// and Gap endpoints (AI counterparts + non-AI features) to backend routes.
import React, { useState } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:4000/api';

const FEATURES = [
  { kind: 'cfs', slug: 'cf-agentic-tutor', label: 'Agentic tutor', desc: 'Student chat → on-demand explanations, practice, quizzes', endpoint: '/cf-agentic-tutor' },
  { kind: 'cfs', slug: 'cf-multi-modal-lessons', label: 'Multi-modal lessons', desc: 'Video + transcript + quiz + spaced-repetition cards', endpoint: '/cf-multi-modal-lessons' },
  { kind: 'cfs', slug: 'cf-peer-review-workflows', label: 'Peer-review workflows', desc: 'Group projects, discussion forums', endpoint: '/cf-peer-review-workflows' },
  { kind: 'cfs', slug: 'cf-irt-adaptive-difficulty', label: 'IRT-adaptive difficulty', desc: 'Adjust quiz difficulty per performance', endpoint: '/cf-irt-adaptive-difficulty' },
  { kind: 'cfs', slug: 'cf-teacher-dashboard', label: 'Teacher dashboard', desc: 'Analytics + intervention suggestions', endpoint: '/cf-teacher-dashboard' },
  { kind: 'cfs', slug: 'cf-badge-credential-issuance', label: 'Badge/credential issuance', desc: 'Track completion, issue digital credentials', endpoint: '/cf-badge-credential-issuance' },
  { kind: 'cfs', slug: 'cf-lti-lms-bridge', label: 'LTI/LMS bridge', desc: 'Canvas/Blackboard integration', endpoint: '/cf-lti-lms-bridge' },
  { kind: 'gap-ai', slug: 'gap-ai-no-accent-detection-in-pronunciation-feedback', label: 'No accent-detection in pronunciation feedback', desc: 'No accent-detection in pronunciation feedback', endpoint: '/gap-no-accent-detection-in-pronunciation-feedback' },
  { kind: 'gap-ai', slug: 'gap-ai-no-irt-adaptive-difficulty-controller', label: 'No IRT-adaptive difficulty controller', desc: 'No IRT-adaptive difficulty controller', endpoint: '/gap-no-irt-adaptive-difficulty-controller' },
  { kind: 'gap-ai', slug: 'gap-ai-no-teacher-dashboard-insight-generator-struggling-student-i', label: 'No teacher-dashboard insight generator (struggling-student i', desc: 'No teacher-dashboard insight generator (struggling-student intervention agent)', endpoint: '/gap-no-teacher-dashboard-insight-generator-struggling-student-i' },
  { kind: 'gap-non', slug: 'gap-non-no-grade-book-endpoint-surfaced', label: 'No grade-book endpoint surfaced', desc: 'No grade-book endpoint surfaced', endpoint: '/gap-no-grade-book-endpoint-surfaced' },
  { kind: 'gap-non', slug: 'gap-non-no-attendance-tracking', label: 'No attendance tracking', desc: 'No attendance tracking', endpoint: '/gap-no-attendance-tracking' },
  { kind: 'gap-non', slug: 'gap-non-no-real-time-chat-only-async-notifications', label: 'No real-time chat (only async notifications)', desc: 'No real-time chat (only async notifications)', endpoint: '/gap-no-real-time-chat-only-async-notifications' },
  { kind: 'gap-non', slug: 'gap-non-no-webhooks-no-lti-canvas-blackboard-inbound', label: 'No webhooks (no LTI/Canvas/Blackboard inbound)', desc: 'No webhooks (no LTI/Canvas/Blackboard inbound)', endpoint: '/gap-no-webhooks-no-lti-canvas-blackboard-inbound' },
  { kind: 'gap-non', slug: 'gap-non-no-payment-subscription-handling', label: 'No payment/subscription handling', desc: 'No payment/subscription handling', endpoint: '/gap-no-payment-subscription-handling' },
  { kind: 'gap-non', slug: 'gap-non-no-badge-credential-issuance', label: 'No badge/credential issuance', desc: 'No badge/credential issuance', endpoint: '/gap-no-badge-credential-issuance' },
  { kind: 'gap-non', slug: 'gap-non-limited-integrations-lms-standards-not-wired', label: 'Limited integrations (LMS standards not wired)', desc: 'Limited integrations (LMS standards not wired)', endpoint: '/gap-limited-integrations-lms-standards-not-wired' },
];

function authHeaders() {
  const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export default function Batch03Features() {
  const [active, setActive] = useState(FEATURES[0]?.slug);
  const [input, setInput] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleRequests = [
      {
          "label": "Scenario",
          "value": "Run Batch03 Features for a realistic customer case.\nContext: a team needs a practical recommendation based on incomplete operating data.\nGoal: identify the best action, key risks, missing information, and expected business impact.\nReturn: summary, prioritized action plan, assumptions, and follow-up questions."
      },
      {
          "label": "Data sample",
          "value": "Analyze this Batch03 Features data sample.\nInput records:\n- Record 1: urgent, customer impact high, owner unassigned\n- Record 2: medium priority, blocked by missing data\n- Record 3: recurring issue, automation opportunity\nReturn structured findings, anomalies, recommendations, and confidence."
      },
      {
          "label": "Executive review",
          "value": "Prepare an executive review for Batch03 Features.\nAudience: business owner, operations lead, and implementation team.\nInclude impact, risk, estimated effort, decision points, and a concise next-step plan."
      }
  ];

  const applySampleRequest = (value) => {
    setInput(value);
    setError(null);
  };
  const current = FEATURES.find(f => f.slug === active) || FEATURES[0];

  async function run() {
    if (!current) return;
    setLoading(true); setError(null);
    try {
      let parsed;
      try { parsed = input ? JSON.parse(input) : {}; } catch { parsed = { input }; }
      const r = await fetch(`${API_BASE}${current.endpoint}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed)
      });
      let body; try { body = await r.json(); } catch { body = { raw: await r.text() }; }
      if (!r.ok) setError(body.error || `HTTP ${r.status}`);
      setResults(prev => ({ ...prev, [current.slug]: body }));
    } catch (e) {
      setError(String(e.message || e));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>Batch 03 Features <small style={{ color: '#64748b', fontWeight: 400 }}>(AIEducationSuite)</small></h2>
      <p style={{ color: '#475569', maxWidth: 720 }}>
        Audit-driven AI counterparts, non-AI feature gaps, and custom feature suggestions.
        Backend endpoints prefixed <code>/api/cf-*</code> (custom features) and <code>/api/gap-*</code> (gap fills).
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {FEATURES.map(f => (
          <button key={f.slug} onClick={() => setActive(f.slug)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1',
                     background: active === f.slug ? '#1e40af' : '#f8fafc',
                     color: active === f.slug ? 'white' : '#0f172a', cursor: 'pointer', fontSize: 12 }}>
            <span style={{ opacity: 0.7, marginRight: 4 }}>[{f.kind}]</span>{f.label}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{current.label}</strong>
            <div style={{ color: '#475569', fontSize: 13 }}>{current.desc}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>POST <code>{current.endpoint}</code></div>
          </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {sampleRequests.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => applySampleRequest(sample.value)}
              style={{ padding: '6px 10px', background: '#eef2ff', color: '#1e3a8a', border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              {sample.label}
            </button>
          ))}
        </div>

          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder='Optional JSON input (e.g. {"query":"..."})'
            style={{ width: '100%', minHeight: 80, padding: 8, fontFamily: 'monospace', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={run} disabled={loading}
              style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
          {error && (<div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>{error}</div>)}
          {results[current.slug] && (
            <pre style={{ marginTop: 12, padding: 10, background: '#0b1020', color: '#cbd5e1', borderRadius: 4, overflow: 'auto', maxHeight: 360, fontSize: 12 }}>
              {typeof results[current.slug] === 'string' ? results[current.slug] : JSON.stringify(results[current.slug], null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
