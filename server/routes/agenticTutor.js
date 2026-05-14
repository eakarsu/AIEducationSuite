// Agentic tutor: student chat → on-demand explanations, practice, quizzes.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const openrouter = require('../services/openrouter');

// POST /api/agentic-tutor/chat { messages:[{role,content}], subject?, level? }
router.post('/chat', auth, aiRateLimiter, async (req, res) => {
  try {
    const { messages = [], subject, level } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] required' });
    }
    let progress;
    try {
      const r = await pool.query(`SELECT * FROM progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5`, [req.userId]);
      progress = r.rows;
    } catch { progress = []; }

    const system = `You are an adaptive tutor. Subject: ${subject || 'general'} Level: ${level || 'auto'}. Use Socratic prompts, give worked examples, then a small quiz. Output JSON: {"reply":"...","next_questions":["..."],"micro_quiz":[{"q":"...","a":"..."}]}.`;
    const ctx = `Recent progress: ${JSON.stringify(progress).slice(0, 1500)}\nMessages:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
    let parsed;
    try {
      const raw = await openrouter.makeRequest([{ role: 'user', content: ctx }], system);
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { reply: raw }; }
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }

    try {
      await pool.query(`INSERT INTO progress (user_id, subject, payload, updated_at) VALUES ($1,$2,$3,NOW())`, [req.userId, subject || 'general', JSON.stringify(parsed)]);
    } catch {}

    return res.json({ response: parsed });
  } catch (e) {
    console.error('agentic-tutor error:', e);
    return res.status(500).json({ error: 'chat failed' });
  }
});

module.exports = router;
