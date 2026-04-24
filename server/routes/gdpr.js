const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /gdpr/export:
 *   get:
 *     summary: Export all user data (GDPR)
 *     tags: [GDPR]
 */
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const [user, essays, music, quizzes, reading, learning, settings, progress, notifications, feedback] = await Promise.all([
      pool.query('SELECT id, email, name, role, bio, phone, timezone, created_at FROM users WHERE id = $1', [req.userId]),
      pool.query('SELECT * FROM essays WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM music_lessons WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM quizzes WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM reading_analyses WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM learning_paths WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM progress_entries WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM notifications WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM feedback WHERE user_id = $1', [req.userId])
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      user: user.rows[0],
      essays: essays.rows,
      music_lessons: music.rows,
      quizzes: quizzes.rows,
      reading_analyses: reading.rows,
      learning_paths: learning.rows,
      settings: settings.rows[0] || null,
      progress: progress.rows,
      notifications: notifications.rows,
      feedback: feedback.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /gdpr/data-summary:
 *   get:
 *     summary: Get data summary for user
 *     tags: [GDPR]
 */
router.get('/data-summary', authMiddleware, async (req, res) => {
  try {
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) FROM essays WHERE user_id = $1', [req.userId]),
      pool.query('SELECT COUNT(*) FROM music_lessons WHERE user_id = $1', [req.userId]),
      pool.query('SELECT COUNT(*) FROM quizzes WHERE user_id = $1', [req.userId]),
      pool.query('SELECT COUNT(*) FROM reading_analyses WHERE user_id = $1', [req.userId]),
      pool.query('SELECT COUNT(*) FROM learning_paths WHERE user_id = $1', [req.userId])
    ]);

    res.json({
      essays: parseInt(counts[0].rows[0].count),
      music_lessons: parseInt(counts[1].rows[0].count),
      quizzes: parseInt(counts[2].rows[0].count),
      reading_analyses: parseInt(counts[3].rows[0].count),
      learning_paths: parseInt(counts[4].rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /gdpr/delete-account:
 *   delete:
 *     summary: Delete user account and all data
 *     tags: [GDPR]
 */
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ error: 'Please type "DELETE MY ACCOUNT" to confirm' });
    }

    // CASCADE will handle related data
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.json({ message: 'Account and all associated data have been permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
