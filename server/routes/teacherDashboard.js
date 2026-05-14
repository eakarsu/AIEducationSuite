// Teacher dashboard: analytics + intervention suggestions.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');
const openrouter = require('../services/openrouter');

// GET /api/teacher-dashboard/class/:class_id — aggregate signals
router.get('/class/:class_id', auth, async (req, res) => {
  try {
    const { class_id } = req.params;
    let students = [];
    try {
      const r = await pool.query(`SELECT u.id, u.email FROM users u INNER JOIN classroom_members cm ON cm.user_id = u.id WHERE cm.class_id = $1`, [class_id]);
      students = r.rows;
    } catch {}

    const signals = [];
    for (const s of students.slice(0, 100)) {
      let progress = null, recent = [];
      try {
        const r = await pool.query(`SELECT AVG(score) AS avg_score, COUNT(*) AS n FROM quiz_results WHERE user_id = $1`, [s.id]);
        progress = r.rows[0];
      } catch {}
      try {
        const r = await pool.query(`SELECT * FROM quiz_results WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 5`, [s.id]);
        recent = r.rows;
      } catch {}
      const risk = progress?.avg_score != null && Number(progress.avg_score) < 60 ? 'at-risk' : 'on-track';
      signals.push({ user_id: s.id, email: s.email, avg_score: progress?.avg_score, attempts: progress?.n, recent_count: recent.length, risk });
    }

    return res.json({ class_id, student_count: students.length, signals });
  } catch (e) {
    return res.status(500).json({ error: 'dashboard failed' });
  }
});

// POST /api/teacher-dashboard/intervention { student_id } — LLM-suggested action
router.post('/intervention', auth, async (req, res) => {
  try {
    const { student_id } = req.body || {};
    if (!student_id) return res.status(400).json({ error: 'student_id required' });
    let perf = null;
    try {
      const r = await pool.query(`SELECT subject, AVG(score) AS avg_score FROM quiz_results WHERE user_id = $1 GROUP BY subject`, [student_id]);
      perf = r.rows;
    } catch { perf = []; }

    const system = 'You are a teacher coach. Suggest specific interventions per subject for a struggling student. Output JSON {"interventions":[{"subject":"...","action":"...","resource":"..."}]}.';
    try {
      const raw = await openrouter.makeRequest([{ role: 'user', content: JSON.stringify(perf) }], system);
      let parsed;
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
      return res.json({ student_id, performance: perf, intervention: parsed });
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'intervention failed' });
  }
});

module.exports = router;
