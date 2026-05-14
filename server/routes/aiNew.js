const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const openrouter = require('../services/openrouter');
require('dotenv').config();

// POST /api/ai/essay-improvement
// Fetches original essay + AI grading, generates improved version with tracked changes summary
router.post('/essay-improvement', auth, aiRateLimiter, async (req, res) => {
  try {
    const { essay_id } = req.body;
    if (!essay_id) return res.status(400).json({ error: 'essay_id is required' });

    const essayResult = await pool.query(
      'SELECT * FROM essays WHERE id = $1 AND user_id = $2',
      [essay_id, req.userId]
    );
    if (essayResult.rows.length === 0) {
      return res.status(404).json({ error: 'Essay not found' });
    }

    const essay = essayResult.rows[0];
    const systemPrompt = `You are an expert writing coach and editor. You help students improve their essays with clear, actionable revisions. Always respond in valid JSON format.`;

    const userPrompt = `You have an original student essay and its AI-generated grading feedback. Generate an improved version with tracked changes.

Original Essay Title: ${essay.title}
Original Essay Content:
${essay.content}

Existing Feedback:
- Grade: ${essay.grade || 'Not graded'}
- Score: ${essay.score || 'N/A'}
- Overall Feedback: ${essay.feedback || 'None'}
- Strengths: ${essay.strengths || 'None'}
- Areas for Improvement: ${essay.improvements || 'None'}
- Grammar Issues: ${essay.grammar_issues || 'None'}

Return a JSON object:
{
  "improved_essay": "The complete improved version of the essay",
  "tracked_changes": [
    {
      "section": "introduction|body|conclusion|grammar",
      "original_text": "exact text that was changed",
      "improved_text": "the replacement text",
      "reason": "why this change improves the essay"
    }
  ],
  "summary_of_changes": {
    "total_changes": 0,
    "structural_changes": "description of structural improvements",
    "style_improvements": "description of style enhancements",
    "grammar_corrections": "description of grammar fixes",
    "content_enhancements": "description of content additions/modifications"
  },
  "projected_grade": "expected grade after improvements",
  "projected_score": 0,
  "writing_tips": ["personalized tips for this student based on their patterns"],
  "next_assignment_advice": "advice for their next essay"
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    const content = response.choices[0].message.content;
    const parsed = openrouter.parseJsonResponse(content);

    res.json({
      essay_id,
      original_score: essay.score,
      original_grade: essay.grade,
      improvement: parsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/study-planner
// Accepts {learning_path_id, target_date}, generates week-by-week study calendar
router.post('/study-planner', auth, aiRateLimiter, async (req, res) => {
  try {
    const { learning_path_id, target_date } = req.body;
    if (!learning_path_id || !target_date) {
      return res.status(400).json({ error: 'learning_path_id and target_date are required' });
    }

    const pathResult = await pool.query(
      'SELECT * FROM learning_paths WHERE id = $1 AND user_id = $2',
      [learning_path_id, req.userId]
    );
    if (pathResult.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const path = pathResult.rows[0];
    const today = new Date();
    const target = new Date(target_date);
    const weeksAvailable = Math.max(1, Math.ceil((target - today) / (7 * 24 * 60 * 60 * 1000)));

    const systemPrompt = `You are an expert study coach and curriculum planner. Create realistic, achievable study schedules. Always respond in valid JSON format.`;

    const userPrompt = `Create a week-by-week study calendar for this learning path.

Learning Path: ${path.title}
Subject: ${path.subject}
Current Level: ${path.current_level || 'beginner'}
Target Level: ${path.target_level || 'advanced'}
Goals: ${path.goals || 'General mastery'}
AI-Generated Path Content: ${JSON.stringify(path.ai_response || {})}
Start Date: ${today.toISOString().split('T')[0]}
Target Completion Date: ${target_date}
Weeks Available: ${weeksAvailable}

Return a JSON object:
{
  "study_plan_title": "title",
  "total_weeks": ${weeksAvailable},
  "hours_per_week_recommended": 0,
  "weekly_schedule": [
    {
      "week": 1,
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "theme": "week focus area",
      "topics": ["topic1", "topic2"],
      "daily_breakdown": {
        "monday": "what to study",
        "tuesday": "what to study",
        "wednesday": "what to study",
        "thursday": "what to study",
        "friday": "what to study",
        "weekend": "review and practice"
      },
      "resources": ["specific resources or exercises"],
      "milestone": "what you should be able to do by end of week",
      "estimated_hours": 0
    }
  ],
  "topic_distribution": {
    "theory_percentage": 0,
    "practice_percentage": 0,
    "review_percentage": 0
  },
  "key_milestones": [
    {
      "week": 0,
      "milestone": "description",
      "assessment": "how to verify this milestone"
    }
  ],
  "flexibility_notes": "how to adapt if falling behind or ahead",
  "success_metrics": ["how to know if the plan is working"]
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    const content = response.choices[0].message.content;
    const parsed = openrouter.parseJsonResponse(content);

    res.json({
      learning_path_id,
      target_date,
      weeks_available: weeksAvailable,
      study_plan: parsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/cohort-analytics
// Aggregates essay scores + quiz results, generates class health summary
router.post('/cohort-analytics', auth, aiRateLimiter, async (req, res) => {
  try {
    const { date_range } = req.body;
    if (!date_range || !date_range.start || !date_range.end) {
      return res.status(400).json({ error: 'date_range with start and end dates is required' });
    }

    const { start, end } = date_range;

    // Aggregate essay data
    const essayStats = await pool.query(`
      SELECT
        COUNT(*) as total_essays,
        AVG(score) as avg_score,
        MIN(score) as min_score,
        MAX(score) as max_score,
        COUNT(CASE WHEN grade IN ('A', 'A-') THEN 1 END) as a_grades,
        COUNT(CASE WHEN grade IN ('B+', 'B', 'B-') THEN 1 END) as b_grades,
        COUNT(CASE WHEN grade IN ('C+', 'C', 'C-') THEN 1 END) as c_grades,
        COUNT(CASE WHEN grade IN ('D', 'F') THEN 1 END) as d_f_grades
      FROM essays
      WHERE created_at BETWEEN $1 AND $2
    `, [start, end]);

    // Aggregate quiz attempt data
    let quizStats = { rows: [{ total_attempts: 0, avg_score: null, subjects: '[]' }] };
    try {
      quizStats = await pool.query(`
        SELECT
          COUNT(*) as total_attempts,
          AVG(score) as avg_score,
          json_agg(DISTINCT subject) as subjects
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.created_at BETWEEN $1 AND $2
      `, [start, end]);
    } catch { /* quiz_attempts table may not exist */ }

    // Get per-user essay counts for spread analysis
    const userSpread = await pool.query(`
      SELECT user_id, COUNT(*) as essay_count, AVG(score) as avg_score
      FROM essays
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY user_id
      ORDER BY avg_score ASC
    `, [start, end]).catch(() => ({ rows: [] }));

    const systemPrompt = `You are an educational data analyst and learning specialist. Provide actionable insights for educators. Always respond in valid JSON format.`;

    const userPrompt = `Analyze this cohort's academic performance and generate a class health summary with intervention recommendations.

Date Range: ${start} to ${end}

Essay Performance Data:
${JSON.stringify(essayStats.rows[0], null, 2)}

Quiz Performance Data:
${JSON.stringify(quizStats.rows[0], null, 2)}

Student Performance Distribution (${userSpread.rows.length} students):
${JSON.stringify(userSpread.rows, null, 2)}

Return a JSON object:
{
  "cohort_health_score": 0-100,
  "overall_assessment": "paragraph summary of class performance",
  "grade_distribution": {
    "a_grades": { "count": 0, "percentage": 0 },
    "b_grades": { "count": 0, "percentage": 0 },
    "c_grades": { "count": 0, "percentage": 0 },
    "d_f_grades": { "count": 0, "percentage": 0 }
  },
  "performance_trends": {
    "trend": "improving|stable|declining",
    "key_observations": ["observation 1", "observation 2"]
  },
  "at_risk_segments": [
    {
      "segment": "description of student group",
      "size_estimate": "percentage or count",
      "risk_factors": ["factor 1", "factor 2"],
      "recommended_interventions": ["intervention 1", "intervention 2"]
    }
  ],
  "high_performers": {
    "percentage": 0,
    "enrichment_opportunities": ["suggested activities for advanced students"]
  },
  "content_difficulty_analysis": {
    "struggling_areas": ["topics where students struggle most"],
    "mastered_areas": ["topics well understood by most"],
    "recommendations": "curriculum adjustment suggestions"
  },
  "intervention_plan": [
    {
      "priority": "immediate|short-term|ongoing",
      "action": "specific intervention",
      "target_group": "who this is for",
      "expected_outcome": "what improvement to expect",
      "timeline": "when to implement"
    }
  ],
  "educator_recommendations": ["actionable steps for teachers"],
  "parent_communication_points": ["key points to share with parents"]
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );

    const content = response.choices[0].message.content;
    const parsed = openrouter.parseJsonResponse(content);

    res.json({
      date_range,
      raw_stats: {
        essays: essayStats.rows[0],
        quizzes: quizStats.rows[0],
        student_count: userSpread.rows.length
      },
      analytics: parsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/ai/quiz-generation
// Generate a quiz on demand from { topic, difficulty, num_questions }.
// Pure-prompt: does not require pre-existing source content.
// =============================================================================
router.post('/quiz-generation', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY missing on server.' });
    }
    const { topic, difficulty, num_questions, subject, source_content } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'topic is required' });

    const n = Math.min(Math.max(parseInt(num_questions, 10) || 5, 1), 25);
    const diff = difficulty || 'medium';
    const subj = subject || topic;
    const title = `Auto-generated quiz: ${topic}`;

    const result = await openrouter.generateQuiz(title, subj, diff, source_content || '', n);

    if (!result.success) {
      return res.status(502).json({ error: result.error || 'Quiz generation failed' });
    }

    // Best-effort persist into quizzes table (don't fail the request if schema differs)
    let quiz_id = null;
    try {
      const insert = await pool.query(
        `INSERT INTO quizzes (user_id, title, subject, difficulty, source_content, questions, num_questions, ai_response)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          req.userId,
          title,
          subj,
          diff,
          source_content || null,
          JSON.stringify(result.data?.questions || []),
          n,
          JSON.stringify(result.data || {})
        ]
      );
      quiz_id = insert.rows[0]?.id ?? null;
    } catch { /* best-effort */ }

    res.json({
      topic,
      subject: subj,
      difficulty: diff,
      num_questions: n,
      quiz_id,
      quiz: result.data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/ai/learning-path-recommend
// Reads the user's quiz attempts + recent essays + existing learning paths and
// returns a sequence of next lesson IDs / topics with rationale.
// Body: { subject?, max_recommendations? }
// =============================================================================
router.post('/learning-path-recommend', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI not configured: OPENROUTER_API_KEY missing on server.' });
    }
    const { subject, max_recommendations } = req.body || {};
    const cap = Math.min(Math.max(parseInt(max_recommendations, 10) || 5, 1), 15);

    // Recent quiz attempts (best-effort — table may not exist)
    let attempts = [];
    try {
      const params = [req.userId];
      let subjectFilter = '';
      if (subject) { params.push(subject); subjectFilter = ' AND q.subject = $2'; }
      const r = await pool.query(
        `SELECT qa.score, qa.completed_at, q.id as quiz_id, q.title, q.subject, q.difficulty
           FROM quiz_attempts qa
           LEFT JOIN quizzes q ON qa.quiz_id = q.id
          WHERE qa.user_id = $1 ${subjectFilter}
          ORDER BY qa.completed_at DESC NULLS LAST
          LIMIT 25`,
        params
      );
      attempts = r.rows;
    } catch { attempts = []; }

    // Recent essays for the user
    let essays = [];
    try {
      const r = await pool.query(
        `SELECT id, title, score, grade, created_at
           FROM essays
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 15`,
        [req.userId]
      );
      essays = r.rows;
    } catch { essays = []; }

    // Existing learning paths
    let paths = [];
    try {
      const params = [req.userId];
      let subjectFilter = '';
      if (subject) { params.push(subject); subjectFilter = ' AND subject = $2'; }
      const r = await pool.query(
        `SELECT id, title, subject, current_level, target_level, goals, ai_response
           FROM learning_paths
          WHERE user_id = $1 ${subjectFilter}
          ORDER BY created_at DESC
          LIMIT 5`,
        params
      );
      paths = r.rows;
    } catch { paths = []; }

    const systemPrompt = `You are an adaptive curriculum recommender. Read the learner's quiz history, essay grades, and any active learning paths, then return JSON only.`;
    const userPrompt = `Recommend the next ${cap} lessons (or topic-units) for this learner.

Subject focus: ${subject || 'any'}
Recent quiz attempts (newest first): ${JSON.stringify(attempts).slice(0, 5000)}
Recent essays (newest first): ${JSON.stringify(essays).slice(0, 3000)}
Active learning paths: ${JSON.stringify(paths).slice(0, 4000)}

Return JSON only:
{
  "learner_summary": "1-paragraph diagnosis of strengths and gaps",
  "current_proficiency": "beginner|intermediate|advanced",
  "recommendations": [
    {
      "rank": 1,
      "lesson_id_or_topic": "stable id from data when present, else a topic title",
      "lesson_type": "concept|practice|review|stretch",
      "subject": "subject name",
      "estimated_minutes": 0,
      "prerequisites_met": true,
      "rationale": "why this is next, citing evidence from the learner's data",
      "expected_mastery_gain": "low|medium|high",
      "success_signal": "how the learner will know this lesson worked"
    }
  ],
  "knowledge_gaps_to_close": ["gap1", "gap2"],
  "warning_flags": ["e.g., low recent engagement, repeated low scores"],
  "review_cadence_recommendation": "spaced-repetition advice"
}`;

    const response = await openrouter.makeRequest(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    );
    const content = response.choices?.[0]?.message?.content || '';
    const parsed = openrouter.parseJsonResponse(content);

    res.json({
      subject: subject || null,
      stats: {
        attempts_analyzed: attempts.length,
        essays_analyzed: essays.length,
        paths_referenced: paths.length
      },
      recommendation: parsed,
      model: response.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
