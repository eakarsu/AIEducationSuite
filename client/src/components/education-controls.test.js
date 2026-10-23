import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NativeEducationPresets, { educationExamples } from './NativeEducationPresets';
import FormattedAIReport from './FormattedAIReport';
import Login from '../pages/Login';
import { api } from '../utils/api';

jest.mock('../utils/api', () => ({
  api: {
    getDemoCredentials: jest.fn(),
    login: jest.fn(),
  },
}));

describe('AI education controls', () => {
  it('offers three distinct complete examples for each core AI workflow', () => {
    for (const [workflow, examples] of Object.entries(educationExamples)) {
      expect(examples).toHaveLength(3);
      const keys = Object.keys(examples[0]);
      expect(keys.length).toBeGreaterThan(1);
      examples.forEach((example) => {
        expect(Object.keys(example).sort()).toEqual(keys.slice().sort());
        Object.values(example).forEach((value) => {
          expect(value).not.toBe('');
          expect(value).not.toBeNull();
        });
      });
      expect(workflow).toBeTruthy();
    }
  });

  it('fires each preset separately without implicitly generating an AI response', () => {
    const onApply = jest.fn();
    render(<NativeEducationPresets onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning basics' }));
    fireEvent.click(screen.getByRole('button', { name: 'Focused practice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Advanced review' }));
    expect(onApply.mock.calls).toEqual([[0], [1], [2]]);
  });

  it('renders structured JSON as readable report fields, preserving false and zero', () => {
    const { container } = render(
      <FormattedAIReport response={'{"summary":"Ready for review","approved":false,"score":0,"next_steps":["Check work","Discuss results"]}'} />,
    );
    expect(container.querySelector('pre')).toBeNull();
    expect(container.textContent).toContain('Summary');
    expect(container.textContent).toContain('Ready for review');
    expect(container.textContent).toContain('No');
    expect(container.textContent).toContain('0');
    expect(container.textContent).toContain('Discuss results');
  });

  it('offers no demo-credential shortcut; sign-in stays explicit', async () => {
    const onLogin = jest.fn();
    render(<MemoryRouter><Login onLogin={onLogin} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Fill Demo Credentials' })).toBeNull();
    expect(api.getDemoCredentials).not.toHaveBeenCalled();
    expect(api.login).not.toHaveBeenCalled();
    expect(onLogin).not.toHaveBeenCalled();
  });
});
