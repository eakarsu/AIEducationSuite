// Multi-modal lessons: video + transcript + quiz + spaced-repetition cards.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const openrouter = require('../services/openrouter');

// POST /api/multi-modal-lessons/compose { subject, topic, video_url?, transcript? }
router.post('/compose', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subject, topic, video_url, transcript } = req.body || {};
    if (!subject || !topic) return res.status(400).json({ error: 'subject + topic required' });

    const system = 'Build a multi-modal lesson. Output JSON: {"summary":"...","quiz":[{"q":"...","a":"..."}],"flashcards":[{"front":"...","back":"..."}],"video_chapters":[{"ts":number,"title":"..."}]}.';
    const user = `Subject: ${subject}\nTopic: ${topic}\nTranscript: ${(transcript || '').slice(0, 4000)}`;
    let raw;
    try {
      raw = await openrouter.makeRequest([{ role: 'user', content: user }], system);
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }
    let parsed;
    try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }

    let lessonId = null;
    try {
      const r = await pool.query(
        `INSERT INTO learning_paths (user_id, subject, payload, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id`,
        [req.userId, subject, JSON.stringify({ topic, video_url, ...parsed })]
      );
      lessonId = r.rows[0].id;
    } catch {}

    if (Array.isArray(parsed.flashcards)) {
      for (const fc of parsed.flashcards.slice(0, 20)) {
        try {
          await pool.query(`INSERT INTO spaced_repetition_cards (user_id, front, back, due_at) VALUES ($1,$2,$3,NOW())`, [req.userId, fc.front, fc.back]);
        } catch {}
      }
    }
    return res.json({ lesson_id: lessonId, ...parsed });
  } catch (e) {
    console.error('multi-modal compose error:', e);
    return res.status(500).json({ error: 'compose failed' });
  }
});

module.exports = router;
