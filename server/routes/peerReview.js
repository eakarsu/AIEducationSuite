// Peer-review workflows: group projects, discussion forums. v0 supports
// assignment of reviewers, review submission, and aggregate scoring.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');

// POST /api/peer-review/assign { essay_id, reviewer_ids:[..], rubric:{...} }
router.post('/assign', auth, async (req, res) => {
  try {
    const { essay_id, reviewer_ids = [], rubric = {} } = req.body || {};
    if (!essay_id || !Array.isArray(reviewer_ids) || reviewer_ids.length === 0) {
      return res.status(400).json({ error: 'essay_id + reviewer_ids required' });
    }
    const assignments = [];
    for (const reviewer_id of reviewer_ids) {
      try {
        const r = await pool.query(
          `INSERT INTO peer_reviews (essay_id, reviewer_id, rubric, status, created_at)
           VALUES ($1,$2,$3,'pending',NOW()) RETURNING id`,
          [essay_id, reviewer_id, JSON.stringify(rubric)]
        );
        assignments.push({ id: r.rows[0].id, reviewer_id });
      } catch (e) {
        assignments.push({ reviewer_id, error: e.message });
      }
    }
    return res.json({ essay_id, assignments });
  } catch (e) {
    console.error('peer-review assign error:', e);
    return res.status(500).json({ error: 'assign failed' });
  }
});

// POST /api/peer-review/:review_id/submit { scores, comments }
router.post('/:review_id/submit', auth, async (req, res) => {
  try {
    const { scores, comments } = req.body || {};
    const { review_id } = req.params;
    try {
      await pool.query(
        `UPDATE peer_reviews SET scores = $1, comments = $2, status = 'submitted', submitted_at = NOW() WHERE id = $3 AND reviewer_id = $4`,
        [JSON.stringify(scores || {}), comments || '', review_id, req.userId]
      );
    } catch (e) {
      return res.status(500).json({ error: 'submit failed', detail: e.message });
    }
    return res.json({ review_id, submitted: true });
  } catch (e) {
    return res.status(500).json({ error: 'submit failed' });
  }
});

// GET /api/peer-review/essay/:essay_id/aggregate — averaged scores
router.get('/essay/:essay_id/aggregate', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT scores FROM peer_reviews WHERE essay_id = $1 AND status = 'submitted'`,
      [req.params.essay_id]
    );
    const all = r.rows.map(x => (typeof x.scores === 'string' ? JSON.parse(x.scores) : x.scores)).filter(Boolean);
    const agg = {};
    for (const row of all) for (const k of Object.keys(row)) {
      agg[k] = agg[k] || { sum: 0, count: 0 };
      agg[k].sum += Number(row[k]) || 0;
      agg[k].count++;
    }
    const averages = {};
    for (const k of Object.keys(agg)) averages[k] = Math.round((agg[k].sum / agg[k].count) * 100) / 100;
    return res.json({ essay_id: req.params.essay_id, review_count: all.length, averages });
  } catch (e) {
    return res.status(500).json({ error: 'aggregate failed' });
  }
});

module.exports = router;
