const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const tableMap = {
  essays: 'essays',
  music: 'music_lessons',
  quizzes: 'quizzes',
  reading: 'reading_analyses',
  learning: 'learning_paths'
};

/**
 * @swagger
 * /export/{type}:
 *   get:
 *     summary: Export user data
 *     tags: [Export]
 */
router.get('/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format || 'json';
    const table = tableMap[type];

    if (!table) return res.status(400).json({ error: 'Invalid export type' });

    const result = await pool.query(`SELECT * FROM ${table} WHERE user_id = $1 ORDER BY created_at DESC`, [req.userId]);

    if (format === 'csv') {
      if (result.rows.length === 0) {
        return res.status(200).set({ 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${type}_export.csv"` }).send('No data');
      }
      const headers = Object.keys(result.rows[0]).filter(k => k !== 'ai_response');
      const csvRows = [headers.join(',')];
      result.rows.forEach(row => {
        csvRows.push(headers.map(h => {
          let val = row[h];
          if (val === null || val === undefined) return '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        }).join(','));
      });
      res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${type}_export.csv"` });
      return res.send(csvRows.join('\n'));
    }

    res.json({ type, exportedAt: new Date().toISOString(), count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
