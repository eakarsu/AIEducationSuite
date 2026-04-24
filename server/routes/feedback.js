const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get user feedback or all feedback (admin)
 *     tags: [Feedback]
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let result;
    if (req.userRole === 'admin' || req.userRole === 'teacher') {
      result = await pool.query('SELECT f.*, u.name as user_name, u.email as user_email FROM feedback f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC');
    } else {
      result = await pool.query('SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback/{id}:
 *   get:
 *     summary: Get single feedback
 *     tags: [Feedback]
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feedback WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Feedback not found' });
    const fb = result.rows[0];
    if (fb.user_id !== req.userId && req.userRole !== 'admin' && req.userRole !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(fb);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Create feedback
 *     tags: [Feedback]
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
    const result = await pool.query(
      'INSERT INTO feedback (user_id, type, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, type || 'general', subject, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback/{id}:
 *   put:
 *     summary: Update feedback / admin respond
 *     tags: [Feedback]
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    if (req.userRole !== 'admin' && req.userRole !== 'teacher') {
      return res.status(403).json({ error: 'Only admins can update feedback status' });
    }
    const result = await pool.query(
      'UPDATE feedback SET status = COALESCE($1, status), admin_response = COALESCE($2, admin_response), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, admin_response, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Feedback not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /feedback/{id}:
 *   delete:
 *     summary: Delete feedback
 *     tags: [Feedback]
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM feedback WHERE id = $1 AND (user_id = $2 OR $3 = \'admin\') RETURNING id',
      [req.params.id, req.userId, req.userRole]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
