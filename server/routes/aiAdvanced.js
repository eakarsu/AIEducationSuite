/**
 * Advanced AI features (audit Section 5):
 *   POST /api/ai/tutor-chat                  Multi-turn tutor chat with conversation memory
 *   POST /api/ai/essays/:id/originality      Plagiarism + AI-content detector
 *   POST /api/ai/quizzes/:id/next-difficulty Adaptive quiz difficulty engine
 *   POST /api/ai/teacher-cohort-report       Teacher dashboard with cohort analytics
 */
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const openrouter = require('../services/openrouter');

// Lazily ensure tutor_chat_history table
let tableEnsured = false;
async function ensureTutorChatTable() {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_chat_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      conversation_id VARCHAR(100) NOT NULL,
      subject VARCHAR(100),
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_tutor_chat_conv ON tutor_chat_history(conversation_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_tutor_chat_user ON tutor_chat_history(user_id);');
  tableEnsured = true;
}

// =============================================================================
// 1. Multi-turn Tutor Chat — persists conversation, uses last 6 messages as ctx
// =============================================================================
router.post('/tutor-chat', auth, aiRateLimiter, async (req, res) => {
  try {
    await ensureTutorChatTable();
    const { message, conversation_id, subject } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const conv_id = conversation_id || `tutor_${req.userId}_${Date.now()}`;

    // Fetch last 6 messages
    const history = await pool.query(
      `SELECT role, content FROM tutor_chat_history
        WHERE conversation_id = $1 AND user_id = $2
        ORDER BY created_at DESC LIMIT 6`,
      [conv_id, req.userId]
    );
    const ctxMessages = history.rows.reverse();

    const systemPrompt = `You are a patient, encouraging AI tutor. Adapt your style to the student's level. Use the conversation history for continuity. Subject focus: ${subject || 'general'}.`;
    const messages = [
      { role: 'system', content: systemPrompt },
      ...ctxMessages.map(r => ({ role: r.role, content: r.content })),
      { role: 'user', content: message }
    ];

    // Persist user message first
    await pool.query(
      `INSERT INTO tutor_chat_history (user_id, conversation_id, subject, role, content)
       VALUES ($1, $2, $3, 'user', $4)`,
      [req.userId, conv_id, subject || null, message]
    );

    const response = await openrouter.makeRequest(messages, systemPrompt);
    const assistantContent = response.choices?.[0]?.message?.content || '';

    await pool.query(
      `INSERT INTO tutor_chat_history (user_id, conversation_id, subject, role, content)
       VALUES ($1, $2, $3, 'assistant', $4)`,
      [req.userId, conv_id, subject || null, assistantContent]
    );

    res.json({
      conversation_id: conv_id,
      response: assistantContent,
      message_count: ctxMessages.length + 2,
      model: response.model,
      usage: response.usage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET conversation history (for UI)
router.get('/tutor-chat/:conversationId', auth, async (req, res) => {
  try {
    await ensureTutorChatTable();
    const r = await pool.query(
      `SELECT id, role, content, created_at FROM tutor_chat_history
        WHERE conversation_id = $1 AND user_id = $2
        ORDER BY created_at ASC`,
      [req.params.conversationId, req.userId]
    );
    res.json({ conversation_id: req.params.conversationId, messages: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List user's conversations
router.get('/tutor-chat', auth, async (req, res) => {
  try {
    await ensureTutorChatTable();
    const r = await pool.query(
      `SELECT conversation_id, subject, COUNT(*) as message_count,
              MIN(created_at) as started_at, MAX(created_at) as last_message_at
        FROM tutor_chat_history
        WHERE user_id = $1
        GROUP BY conversation_id, subject
        ORDER BY MAX(created_at) DESC LIMIT 50`,
      [req.userId]
    );
    res.json({ conversations: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// 2. Plagiarism + AI-content detector — second-pass on submitted essay
// =============================================================================
router.post('/essays/:id/originality', auth, aiRateLimiter, async (req, res) => {
  try {
    const essay = await pool.query(
      'SELECT * FROM essays WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (essay.rows.length === 0) return res.status(404).json({ error: 'Essay not found' });

    const e = essay.rows[0];
    const systemPrompt = 'You are a writing-integrity analyst. Detect signs of AI generation and probable plagiarism. Always respond in valid JSON.';
    const prompt = `Analyze the following student essay for originality and AI-generation likelihood.

Title: ${e.title}
Content: ${e.content}

Look for:
- Stylistic homogeneity typical of LLM output
- Unusual vocabulary patterns inconsistent with student's apparent level
- Generic phrasings, lack of personal voice, perfect grammar with no idiosyncrasies
- Likely paraphrase of well-known sources

Return JSON: {
  "originality_score": 0-100,
  "likelihood_of_ai_generated": 0-100,
  "ai_indicators": ["specific stylistic markers found"],
  "voice_consistency": "strong|moderate|weak|inconsistent",
  "stylistic_red_flags": ["red flag 1", "red flag 2"],
  "suggested_paraphrase_sources": ["topic or known source"],
  "verdict": "likely_original|likely_assisted|likely_ai_generated|inconclusive",
  "confidence": 0-100,
  "teacher_recommended_action": "accept|verbal_check|request_revision|flag_for_review",
  "explanation": "1-2 paragraph rationale"
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: prompt }],
      systemPrompt
    );
    const content = response.choices?.[0]?.message?.content || '';
    const parsed = openrouter.parseJsonResponse(content);

    // Persist alongside essay (best-effort)
    try {
      await pool.query(
        'UPDATE essays SET originality_check = $1 WHERE id = $2',
        [JSON.stringify(parsed), req.params.id]
      );
    } catch {
      // Column may not exist — try to add it
      try {
        await pool.query('ALTER TABLE essays ADD COLUMN IF NOT EXISTS originality_check JSONB');
        await pool.query('UPDATE essays SET originality_check = $1 WHERE id = $2',
          [JSON.stringify(parsed), req.params.id]);
      } catch { /* best-effort */ }
    }

    res.json({
      essay_id: req.params.id,
      originality: parsed,
      model: response.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 3. Adaptive Quiz Difficulty Engine — picks next difficulty based on history
// =============================================================================
router.post('/quizzes/:id/next-difficulty', auth, aiRateLimiter, async (req, res) => {
  try {
    const quizR = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    if (quizR.rows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
    const quiz = quizR.rows[0];

    // Pull recent attempts for this user/subject
    let attempts = [];
    try {
      const r = await pool.query(
        `SELECT qa.score, qa.completed_at, q.difficulty, q.subject, q.title
           FROM quiz_attempts qa
           LEFT JOIN quizzes q ON qa.quiz_id = q.id
          WHERE qa.user_id = $1 AND (q.subject = $2 OR q.id = $3)
          ORDER BY qa.completed_at DESC LIMIT 10`,
        [req.userId, quiz.subject, req.params.id]
      );
      attempts = r.rows;
    } catch { attempts = []; }

    // Pull spaced-repetition data if available for the subject
    let srsContext = [];
    try {
      const r = await pool.query(
        `SELECT topic, ease_factor, interval_days, repetitions, next_review_date
           FROM spaced_repetition_cards
          WHERE user_id = $1 ORDER BY next_review_date ASC LIMIT 20`,
        [req.userId]
      );
      srsContext = r.rows;
    } catch { srsContext = []; }

    const systemPrompt = 'You are an adaptive learning specialist. Recommend the next quiz difficulty and content focus. Always respond in valid JSON.';
    const prompt = `Recommend the next quiz difficulty for this student based on their performance.

Subject: ${quiz.subject}
Current Quiz Difficulty: ${quiz.difficulty}
Recent attempts: ${JSON.stringify(attempts)}
Spaced-repetition state: ${JSON.stringify(srsContext)}

Return JSON: {
  "recommended_difficulty": "easy|medium|hard|expert",
  "current_mastery_level": 0-100,
  "reasoning": "why this difficulty",
  "focus_topics": ["topic1", "topic2"],
  "topics_to_avoid": ["topics already mastered"],
  "recommended_question_count": 0,
  "adaptive_strategy": "build_confidence|push_growth|review_weaknesses|extend_mastery",
  "next_quiz_themes": ["specific themes for next quiz"],
  "estimated_time_minutes": 0
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: prompt }],
      systemPrompt
    );
    const content = response.choices?.[0]?.message?.content || '';
    const parsed = openrouter.parseJsonResponse(content);

    res.json({
      quiz_id: req.params.id,
      attempt_count: attempts.length,
      adaptation: parsed,
      model: response.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// 4. Teacher dashboard cohort analytics — wraps existing per-class report
// (Augments the existing /cohort-analytics by allowing role/subject scoping)
// =============================================================================
router.post('/teacher-cohort-report', auth, aiRateLimiter, async (req, res) => {
  try {
    const { date_range, subject } = req.body;
    if (!date_range?.start || !date_range?.end) {
      return res.status(400).json({ error: 'date_range.start and date_range.end are required' });
    }

    const params = [date_range.start, date_range.end];
    let subjectFilter = '';
    if (subject) {
      params.push(subject);
      subjectFilter = ' AND e.subject = $3';
    }

    // Per-student summary
    const studentRows = await pool.query(
      `SELECT u.id as user_id, u.name, COUNT(e.id) as essay_count,
              AVG(e.score) as avg_score,
              COUNT(CASE WHEN e.grade IN ('A','A-') THEN 1 END) as a_grades
         FROM users u
         LEFT JOIN essays e ON e.user_id = u.id AND e.created_at BETWEEN $1 AND $2
        WHERE u.role = 'student'
        GROUP BY u.id, u.name
        ORDER BY avg_score ASC NULLS LAST
        LIMIT 200`,
      [date_range.start, date_range.end]
    ).catch(() => ({ rows: [] }));

    // Topic gaps from learning_paths
    let topicGaps = [];
    try {
      const r = await pool.query(
        `SELECT subject, ai_response FROM learning_paths
          WHERE created_at BETWEEN $1 AND $2 ${subjectFilter}`,
        params
      );
      topicGaps = r.rows.map(row => ({ subject: row.subject, gaps: row.ai_response?.struggling_areas || [] }));
    } catch { topicGaps = []; }

    const systemPrompt = 'You are a master teacher analyzing classroom performance. Always respond in valid JSON.';
    const prompt = `Generate a comprehensive teacher cohort report.

Date range: ${date_range.start} to ${date_range.end}
Subject focus: ${subject || 'all subjects'}

Per-student summary (${studentRows.rows.length} students):
${JSON.stringify(studentRows.rows.slice(0, 50), null, 2)}

Topic gaps from learning paths:
${JSON.stringify(topicGaps.slice(0, 30), null, 2)}

Return JSON: {
  "class_overview": "executive summary",
  "cohort_grade": "A|B|C|D|F",
  "average_class_score": 0,
  "students_at_risk": [{"user_id": 0, "name": "string", "concern": "string", "suggested_intervention": "string"}],
  "top_performers": [{"user_id": 0, "name": "string", "enrichment": "string"}],
  "common_knowledge_gaps": [{"topic": "string", "affected_percent": 0, "recommended_lesson": "string"}],
  "recommended_next_lessons": [{"lesson_topic": "string", "rationale": "string", "duration_minutes": 0}],
  "parent_communication_themes": ["theme 1", "theme 2"],
  "teacher_action_items_this_week": ["item 1", "item 2", "item 3"],
  "data_quality_notes": "notes about data completeness or limitations"
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: prompt }],
      systemPrompt
    );
    const content = response.choices?.[0]?.message?.content || '';
    const parsed = openrouter.parseJsonResponse(content);

    res.json({
      date_range,
      subject: subject || null,
      stats: {
        student_count: studentRows.rows.length,
        topic_gap_records: topicGaps.length
      },
      report: parsed,
      model: response.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
