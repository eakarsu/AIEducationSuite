const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit contact message
 *     tags: [Contact]
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!email || !subject || !message) return res.status(400).json({ error: 'Email, subject, and message are required' });

    // If authenticated, link to user
    let userId = null;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) { /* not authenticated - that's ok */ }
    }

    const result = await pool.query(
      'INSERT INTO contact_messages (user_id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name || 'Anonymous', email, subject, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /contact:
 *   get:
 *     summary: Get contact messages
 *     tags: [Contact]
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let result;
    if (req.userRole === 'admin') {
      result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    } else {
      result = await pool.query('SELECT * FROM contact_messages WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /contact/{id}:
 *   put:
 *     summary: Update contact message status (admin)
 *     tags: [Contact]
 */
router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
