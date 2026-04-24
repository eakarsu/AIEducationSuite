import React from 'react';
import { FiCpu, FiCheckCircle, FiAlertCircle, FiInfo, FiStar, FiTarget, FiBook, FiClock, FiAward, FiTrendingUp } from 'react-icons/fi';
import './AIResponseDisplay.css';

function AIResponseDisplay({ data, type }) {
  if (!data) return null;

  const renderEssayResponse = () => {
    return (
      <div className="ai-response fade-in">
        <div className="ai-response-header">
          <div className="ai-response-icon">
            <FiCpu />
          </div>
          <div>
            <div className="ai-response-title">AI Analysis Results</div>
            <div className="ai-response-subtitle">Powered by Claude AI</div>
          </div>
        </div>

        {data.grade && (
          <div className="ai-score-section">
            <div className={`ai-score-circle grade-${data.grade?.toLowerCase().charAt(0)}`}>
              <span className="ai-score-grade">{data.grade}</span>
              <span className="ai-score-label">Grade</span>
            </div>
            {data.score && (
              <div className="ai-score-details">
                <div className="ai-score-number">{data.score}/100</div>
                <div className="ai-score-bar">
                  <div className="ai-score-bar-fill" style={{ width: `${data.score}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        {data.feedback && (
          <div className="ai-response-section">
            <h4><FiInfo /> Overall Feedback</h4>
            <p>{data.feedback}</p>
          </div>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <div className="ai-response-section">
            <h4><FiCheckCircle className="text-success" /> Strengths</h4>
            <ul className="ai-list success">
              {(Array.isArray(data.strengths) ? data.strengths : [data.strengths]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {data.improvements && data.improvements.length > 0 && (
          <div className="ai-response-section">
            <h4><FiAlertCircle className="text-warning" /> Areas for Improvement</h4>
            <ul className="ai-list warning">
              {(Array.isArray(data.improvements) ? data.improvements : [data.improvements]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {data.structure && (
          <div className="ai-response-section">
            <h4><FiBook /> Structure Analysis</h4>
            <div className="ai-structure-grid">
              {data.structure.introduction && (
                <div className="ai-structure-item">
                  <span className="ai-structure-label">Introduction</span>
                  <p>{data.structure.introduction}</p>
                </div>
              )}
              {data.structure.body && (
                <div className="ai-structure-item">
                  <span className="ai-structure-label">Body</span>
                  <p>{data.structure.body}</p>
                </div>
              )}
              {data.structure.conclusion && (
                <div className="ai-structure-item">
                  <span className="ai-structure-label">Conclusion</span>
                  <p>{data.structure.conclusion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {data.writingStyle && (
          <div className="ai-response-section">
            <h4><FiStar /> Writing Style</h4>
            <p>{data.writingStyle}</p>
          </div>
        )}
      </div>
    );
  };

  const renderMusicResponse = () => {
    return (
      <div className="ai-response fade-in">
        <div className="ai-response-header">
          <div className="ai-response-icon music">
            <FiCpu />
          </div>
          <div>
            <div className="ai-response-title">{data.lessonTitle || 'AI Generated Lesson'}</div>
            <div className="ai-response-subtitle">Personalized Music Instruction</div>
          </div>
        </div>

        {data.objectives && (
          <div className="ai-response-section">
            <h4><FiTarget /> Learning Objectives</h4>
            <ul className="ai-list primary">
              {data.objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {data.warmup && (
          <div className="ai-response-section">
            <h4><FiClock /> Warmup ({data.warmup.duration})</h4>
            <p>{data.warmup.description}</p>
          </div>
        )}

        {data.mainContent && (
          <div className="ai-response-section">
            <h4><FiBook /> Lesson Content</h4>
            <div className="ai-content-cards">
              {data.mainContent.theory && (
                <div className="ai-content-card">
                  <span className="ai-content-card-title">Theory</span>
                  <p>{data.mainContent.theory}</p>
                </div>
              )}
              {data.mainContent.technique && (
                <div className="ai-content-card">
                  <span className="ai-content-card-title">Technique</span>
                  <p>{data.mainContent.technique}</p>
                </div>
              )}
              {data.mainContent.demonstration && (
                <div className="ai-content-card">
                  <span className="ai-content-card-title">Demonstration</span>
                  <p>{data.mainContent.demonstration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {data.exercises && data.exercises.length > 0 && (
          <div className="ai-response-section">
            <h4><FiAward /> Practice Exercises</h4>
            <div className="ai-exercises-list">
              {data.exercises.map((exercise, idx) => (
                <div key={idx} className="ai-exercise-item">
                  <div className="ai-exercise-header">
                    <span className="ai-exercise-number">{idx + 1}</span>
                    <span className="ai-exercise-name">{exercise.name}</span>
                  </div>
                  <p>{exercise.description}</p>
                  {exercise.repetitions && (
                    <span className="ai-exercise-reps">{exercise.repetitions}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.tips && data.tips.length > 0 && (
          <div className="ai-response-section">
            <h4><FiStar /> Pro Tips</h4>
            <ul className="ai-list success">
              {data.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderQuizResponse = () => {
    return (
      <div className="ai-response fade-in">
        <div className="ai-response-header">
          <div className="ai-response-icon quiz">
            <FiCpu />
          </div>
          <div>
            <div className="ai-response-title">{data.quizTitle || 'AI Generated Quiz'}</div>
            <div className="ai-response-subtitle">{data.totalQuestions} Questions • {data.estimatedTime}</div>
          </div>
        </div>

        {data.instructions && (
          <div className="ai-response-section">
            <h4><FiInfo /> Instructions</h4>
            <p>{data.instructions}</p>
          </div>
        )}

        {data.questions && data.questions.length > 0 && (
          <div className="ai-response-section">
            <h4><FiBook /> Questions</h4>
            <div className="ai-quiz-questions">
              {data.questions.map((q, idx) => (
                <div key={idx} className="ai-quiz-question">
                  <div className="ai-quiz-question-header">
                    <span className="ai-quiz-question-number">Q{q.id || idx + 1}</span>
                    <span className="ai-quiz-question-text">{q.question}</span>
                  </div>
                  <div className="ai-quiz-options">
                    {q.options.map((option, optIdx) => (
                      <div
                        key={optIdx}
                        className={`ai-quiz-option ${optIdx === q.correctAnswer ? 'correct' : ''}`}
                      >
                        <span className="ai-quiz-option-letter">{String.fromCharCode(65 + optIdx)}</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="ai-quiz-explanation">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReadingResponse = () => {
    return (
      <div className="ai-response fade-in">
        <div className="ai-response-header">
          <div className="ai-response-icon reading">
            <FiCpu />
          </div>
          <div>
            <div className="ai-response-title">Reading Level Analysis</div>
            <div className="ai-response-subtitle">Content Difficulty Assessment</div>
          </div>
        </div>

        <div className="ai-reading-stats">
          <div className="ai-reading-stat">
            <div className="ai-reading-stat-value">{data.readingLevel}</div>
            <div className="ai-reading-stat-label">Reading Level</div>
          </div>
          <div className="ai-reading-stat">
            <div className="ai-reading-stat-value">{data.gradeLevel}</div>
            <div className="ai-reading-stat-label">Grade Level</div>
          </div>
          <div className="ai-reading-stat">
            <div className="ai-reading-stat-value">{data.difficultyScore}/100</div>
            <div className="ai-reading-stat-label">Difficulty Score</div>
          </div>
        </div>

        {data.metrics && (
          <div className="ai-response-section">
            <h4><FiInfo /> Readability Metrics</h4>
            <div className="ai-metrics-grid">
              <div className="ai-metric">
                <span className="ai-metric-label">Flesch-Kincaid</span>
                <span className="ai-metric-value">{data.metrics.fleschKincaid}</span>
              </div>
              <div className="ai-metric">
                <span className="ai-metric-label">Avg Sentence Length</span>
                <span className="ai-metric-value">{data.metrics.averageSentenceLength}</span>
              </div>
              <div className="ai-metric">
                <span className="ai-metric-label">Vocabulary Level</span>
                <span className="ai-metric-value">{data.metrics.vocabularyLevel}</span>
              </div>
            </div>
          </div>
        )}

        {data.vocabularyAnalysis && (
          <div className="ai-response-section">
            <h4><FiBook /> Vocabulary Analysis</h4>
            <p><strong>Complexity:</strong> {data.vocabularyAnalysis.complexity}</p>
            {data.vocabularyAnalysis.technicalTerms && data.vocabularyAnalysis.technicalTerms.length > 0 && (
              <div className="ai-tags">
                {data.vocabularyAnalysis.technicalTerms.map((term, idx) => (
                  <span key={idx} className="ai-tag">{term}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {data.targetAudience && (
          <div className="ai-response-section">
            <h4><FiTarget /> Target Audience</h4>
            <p>{data.targetAudience}</p>
          </div>
        )}

        {data.recommendations && data.recommendations.length > 0 && (
          <div className="ai-response-section">
            <h4><FiCheckCircle /> Recommendations</h4>
            <ul className="ai-list primary">
              {(Array.isArray(data.recommendations) ? data.recommendations : [data.recommendations]).map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {data.summary && (
          <div className="ai-response-section">
            <h4><FiStar /> Summary</h4>
            <p>{data.summary}</p>
          </div>
        )}
      </div>
    );
  };

  const renderLearningResponse = () => {
    return (
      <div className="ai-response fade-in">
        <div className="ai-response-header">
          <div className="ai-response-icon learning">
            <FiCpu />
          </div>
          <div>
            <div className="ai-response-title">{data.pathTitle || 'AI Learning Path'}</div>
            <div className="ai-response-subtitle">{data.estimatedDuration} • {data.subject}</div>
          </div>
        </div>

        {data.overview && (
          <div className="ai-response-section">
            <h4><FiInfo /> Overview</h4>
            <p>{data.overview}</p>
          </div>
        )}

        {data.prerequisites && data.prerequisites.length > 0 && (
          <div className="ai-response-section">
            <h4><FiCheckCircle /> Prerequisites</h4>
            <ul className="ai-list primary">
              {data.prerequisites.map((pre, idx) => (
                <li key={idx}>{pre}</li>
              ))}
            </ul>
          </div>
        )}

        {data.phases && data.phases.length > 0 && (
          <div className="ai-response-section">
            <h4><FiTrendingUp /> Learning Phases</h4>
            <div className="ai-phases-timeline">
              {data.phases.map((phase, idx) => (
                <div key={idx} className="ai-phase-item">
                  <div className="ai-phase-marker">{phase.phase || idx + 1}</div>
                  <div className="ai-phase-content">
                    <div className="ai-phase-header">
                      <h5>{phase.name}</h5>
                      <span className="ai-phase-duration">{phase.duration}</span>
                    </div>
                    <p className="ai-phase-focus">{phase.focus}</p>
                    {phase.topics && (
                      <div className="ai-phase-topics">
                        {phase.topics.map((topic, tIdx) => (
                          <span key={tIdx} className="ai-topic-tag">{topic}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.weeklySchedule && (
          <div className="ai-response-section">
            <h4><FiClock /> Weekly Schedule</h4>
            <p><strong>Recommended:</strong> {data.weeklySchedule.hoursPerWeek}</p>
            {data.weeklySchedule.breakdown && (
              <div className="ai-schedule-breakdown">
                <div className="ai-schedule-item">
                  <span>Theory</span>
                  <span>{data.weeklySchedule.breakdown.theory}</span>
                </div>
                <div className="ai-schedule-item">
                  <span>Practice</span>
                  <span>{data.weeklySchedule.breakdown.practice}</span>
                </div>
                <div className="ai-schedule-item">
                  <span>Projects</span>
                  <span>{data.weeklySchedule.breakdown.projects}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {data.finalProject && (
          <div className="ai-response-section">
            <h4><FiAward /> Capstone Project</h4>
            <div className="ai-capstone">
              <h5>{data.finalProject.title}</h5>
              <p>{data.finalProject.description}</p>
            </div>
          </div>
        )}

        {data.tips && data.tips.length > 0 && (
          <div className="ai-response-section">
            <h4><FiStar /> Success Tips</h4>
            <ul className="ai-list success">
              {data.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  switch (type) {
    case 'essay':
      return renderEssayResponse();
    case 'music':
      return renderMusicResponse();
    case 'quiz':
      return renderQuizResponse();
    case 'reading':
      return renderReadingResponse();
    case 'learning':
      return renderLearningResponse();
    default:
      return (
        <div className="ai-response">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
  }
}

export default AIResponseDisplay;
