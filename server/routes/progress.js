const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /progress:
 *   get:
 *     summary: Get user progress entries
 *     tags: [Progress]
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM progress_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /progress/stats:
 *   get:
 *     summary: Get aggregated progress stats
 *     tags: [Progress]
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [byType, timeline, avgScores] = await Promise.all([
      pool.query(
        `SELECT feature_type, COUNT(*) as count, AVG(score) as avg_score
         FROM progress_entries WHERE user_id = $1 GROUP BY feature_type`,
        [req.userId]
      ),
      pool.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM progress_entries WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY date`,
        [req.userId]
      ),
      pool.query(
        `SELECT feature_type, ROUND(AVG(score)::numeric, 1) as avg_score
         FROM progress_entries WHERE user_id = $1 AND score IS NOT NULL GROUP BY feature_type`,
        [req.userId]
      )
    ]);

    res.json({
      byType: byType.rows,
      timeline: timeline.rows,
      avgScores: avgScores.rows,
      totalActivities: byType.rows.reduce((sum, r) => sum + parseInt(r.count), 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /progress:
 *   post:
 *     summary: Create progress entry
 *     tags: [Progress]
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { feature_type, item_id, action, score, metadata } = req.body;
    const result = await pool.query(
      `INSERT INTO progress_entries (user_id, feature_type, item_id, action, score, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, feature_type, item_id, action, score, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
