import React from 'react';
import FormattedAIReport from './FormattedAIReport';
const titles = { essay: 'Essay assessment', music: 'Music lesson', quiz: 'Quiz report', reading: 'Reading analysis', learning: 'Learning path', language: 'Language session' };
export default function AIResponseDisplay({ data, type }) {
  if (!data) return null;
  return <FormattedAIReport response={data} title={titles[type] || 'AI report'} />;
}
