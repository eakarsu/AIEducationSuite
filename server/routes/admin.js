const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin/teacher only)
 *     tags: [Admin]
 */
router.get('/users', authMiddleware, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get single user details
 *     tags: [Admin]
 */
router.get('/users/:id', authMiddleware, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, bio, phone, timezone, email_verified, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 */
router.put('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { name, role, email_verified } = req.body;
    const result = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role),
       email_verified = COALESCE($3, email_verified), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING id, email, name, role, email_verified, created_at, updated_at`,
      [name, role, email_verified, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 */
router.delete('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account from admin panel' });
    }
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     tags: [Admin]
 */
router.get('/stats', authMiddleware, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const [users, essays, music, quizzes, reading, learning] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM essays'),
      pool.query('SELECT COUNT(*) FROM music_lessons'),
      pool.query('SELECT COUNT(*) FROM quizzes'),
      pool.query('SELECT COUNT(*) FROM reading_analyses'),
      pool.query('SELECT COUNT(*) FROM learning_paths')
    ]);
    res.json({
      users: parseInt(users.rows[0].count),
      essays: parseInt(essays.rows[0].count),
      music_lessons: parseInt(music.rows[0].count),
      quizzes: parseInt(quizzes.rows[0].count),
      reading_analyses: parseInt(reading.rows[0].count),
      learning_paths: parseInt(learning.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
