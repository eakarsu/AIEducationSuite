import React, { useState } from 'react';
import { FiArrowRight, FiX, FiFileText, FiMusic, FiHelpCircle, FiBook, FiTrendingUp } from 'react-icons/fi';
import { api } from '../utils/api';

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to AI Education Suite!',
      content: 'Your comprehensive AI-powered learning platform. Let us show you around.',
      icon: '🎓'
    },
    {
      title: 'AI-Powered Learning Tools',
      content: 'Access 5 powerful AI tools:',
      features: [
        { icon: <FiFileText />, label: 'Essay Grader - Get instant AI feedback on your writing' },
        { icon: <FiMusic />, label: 'Music Teacher - Personalized instrument lessons' },
        { icon: <FiHelpCircle />, label: 'Quiz Maker - Generate quizzes from any content' },
        { icon: <FiBook />, label: 'Reading Analyzer - Analyze text difficulty' },
        { icon: <FiTrendingUp />, label: 'Learning Paths - Custom learning curricula' }
      ]
    },
    {
      title: 'Track Your Progress',
      content: 'Monitor your learning journey with progress tracking, activity timelines, and score trends. Everything is saved and exportable.',
      icon: '📊'
    },
    {
      title: 'You\'re All Set!',
      content: 'Start exploring the dashboard and try out any of the AI tools. Happy learning!',
      icon: '🚀'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try { await api.completeOnboarding(); } catch (e) { /* ok */ }
    onComplete();
  };

  const currentStep = steps[step];

  return (
    <div className="modal-overlay">
      <div className="modal modal-medium" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Getting Started ({step + 1}/{steps.length})</h2>
          <button className="modal-close" onClick={handleComplete}><FiX /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
          {currentStep.icon && <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentStep.icon}</div>}
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{currentStep.title}</h3>
          {currentStep.content && <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>{currentStep.content}</p>}
          {currentStep.features && (
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentStep.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--primary)' }}>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleComplete}>Skip</button>
          <button className="btn btn-primary" onClick={handleNext}>
            {step < steps.length - 1 ? <><FiArrowRight /> Next</> : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
