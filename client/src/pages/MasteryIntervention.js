import NativeEducationPresets from '../components/NativeEducationPresets';
import FormattedAIReport from '../components/FormattedAIReport';
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
        <NativeEducationPresets onApply={(index) => setForm([
          { quizScore: 62, attempts: 2, missedStandards: 'fractions,word problems', daysSincePractice: 6, confidence: 2 },
          { quizScore: 78, attempts: 3, missedStandards: 'equivalent fractions', daysSincePractice: 3, confidence: 3 },
          { quizScore: 91, attempts: 4, missedStandards: 'multi-step reasoning', daysSincePractice: 1, confidence: 4 }
        ][index])} />
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
      {result && <FormattedAIReport response={result} title="Intervention plan" />}
    </div>
  );
}
