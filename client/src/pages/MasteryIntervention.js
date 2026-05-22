import React, { useState } from 'react';

export default function MasteryIntervention() {
  const [form, setForm] = useState({
    quizScore: 62,
    attempts: 2,
    missedStandards: 'fractions,word problems',
    daysSincePractice: 6,
    confidence: 2,
  });
  const [result, setResult] = useState(null);

  const submit = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/mastery-intervention/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({
        ...form,
        missedStandards: form.missedStandards.split(',').map((item) => item.trim()).filter(Boolean),
      }),
    });
    setResult(await response.json());
  };

  return (
    <div className="feature-page">
      <h1>Mastery Intervention Planner</h1>
      <div className="feature-card">
        {['quizScore', 'attempts', 'daysSincePractice', 'confidence'].map((key) => (
          <label key={key}>{key.replace(/([A-Z])/g, ' $1')}
            <input type="number" value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
          </label>
        ))}
        <label>Missed standards
          <input value={form.missedStandards} onChange={(e) => setForm({ ...form, missedStandards: e.target.value })} />
        </label>
        <button onClick={submit}>Plan intervention</button>
      </div>
      {result && (
        <div className="feature-card">
          <h2>{result.tier.toUpperCase()} · {result.riskScore}/100</h2>
          <ul>{result.nextMoves.map((move) => <li key={move}>{move}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
