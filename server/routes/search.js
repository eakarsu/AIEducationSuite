const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search across all content
 *     tags: [Search]
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length === 0) return res.json({ results: [] });

    const searchTerm = `%${q.trim()}%`;
    const results = {};

    if (!type || type === 'all' || type === 'essays') {
      const essays = await pool.query(
        `SELECT id, title, 'essay' as type, grade, score, created_at FROM essays
         WHERE user_id = $1 AND (title ILIKE $2 OR content ILIKE $2) LIMIT 10`,
        [req.userId, searchTerm]
      );
      results.essays = essays.rows;
    }

    if (!type || type === 'all' || type === 'music') {
      const music = await pool.query(
        `SELECT id, topic as title, 'music' as type, instrument, skill_level, created_at FROM music_lessons
         WHERE user_id = $1 AND (topic ILIKE $2 OR instrument ILIKE $2 OR lesson_content ILIKE $2) LIMIT 10`,
        [req.userId, searchTerm]
      );
      results.music = music.rows;
    }

    if (!type || type === 'all' || type === 'quizzes') {
      const quizzes = await pool.query(
        `SELECT id, title, 'quiz' as type, subject, difficulty, created_at FROM quizzes
         WHERE user_id = $1 AND (title ILIKE $2 OR subject ILIKE $2) LIMIT 10`,
        [req.userId, searchTerm]
      );
      results.quizzes = quizzes.rows;
    }

    if (!type || type === 'all' || type === 'reading') {
      const reading = await pool.query(
        `SELECT id, title, 'reading' as type, reading_level, created_at FROM reading_analyses
         WHERE user_id = $1 AND (title ILIKE $2 OR content ILIKE $2) LIMIT 10`,
        [req.userId, searchTerm]
      );
      results.reading = reading.rows;
    }

    if (!type || type === 'all' || type === 'learning') {
      const learning = await pool.query(
        `SELECT id, title, 'learning' as type, subject, current_level, target_level, created_at FROM learning_paths
         WHERE user_id = $1 AND (title ILIKE $2 OR subject ILIKE $2) LIMIT 10`,
        [req.userId, searchTerm]
      );
      results.learning = learning.rows;
    }

    res.json({ results, query: q });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
