// IRT-adaptive difficulty: adjust quiz difficulty per student performance.
// v0 implements a simple 1PL Rasch update: ability and item-difficulty MLE.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// POST /api/irt/update  { item_id, correct: bool, prior_theta?, prior_b? }
router.post('/update', auth, async (req, res) => {
  try {
    const { item_id, correct, prior_theta, prior_b } = req.body || {};
    if (item_id == null || correct == null) return res.status(400).json({ error: 'item_id and correct required' });
    const theta = Number(prior_theta != null ? prior_theta : 0);
    const b = Number(prior_b != null ? prior_b : 0);
    const lr = 0.4;
    const p = sigmoid(theta - b);
    const newTheta = theta + lr * ((correct ? 1 : 0) - p);
    const newB = b - lr * ((correct ? 1 : 0) - p);
    try {
      await pool.query(
        `INSERT INTO irt_state (user_id, item_id, theta, b, updated_at) VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (user_id,item_id) DO UPDATE SET theta = EXCLUDED.theta, b = EXCLUDED.b, updated_at = NOW()`,
        [req.userId, item_id, newTheta, newB]
      );
    } catch {}
    return res.json({ user_id: req.userId, item_id, theta: newTheta, b: newB, p_predicted: p });
  } catch (e) {
    return res.status(500).json({ error: 'update failed' });
  }
});

// GET /api/irt/next-item?candidates=1,2,3 — choose item nearest current ability
router.get('/next-item', auth, async (req, res) => {
  try {
    const candidates = (req.query.candidates || '').split(',').filter(Boolean);
    if (!candidates.length) return res.status(400).json({ error: 'candidates query required' });
    let theta = 0;
    try {
      const r = await pool.query(`SELECT AVG(theta) AS t FROM irt_state WHERE user_id = $1`, [req.userId]);
      theta = Number(r.rows[0].t) || 0;
    } catch {}
    let best = { item_id: candidates[0], distance: Infinity };
    for (const c of candidates) {
      try {
        const r = await pool.query(`SELECT b FROM irt_state WHERE item_id = $1 LIMIT 1`, [c]);
        const b = Number(r.rows[0]?.b || 0);
        const d = Math.abs(theta - b);
        if (d < best.distance) best = { item_id: c, distance: d, b };
      } catch {}
    }
    return res.json({ theta, recommended: best });
  } catch (e) {
    return res.status(500).json({ error: 'next-item failed' });
  }
});

module.exports = router;
