const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, bio, avatar_url, phone, timezone, email_verified, onboarding_completed, created_at, updated_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, bio, phone, timezone, avatar_url } = req.body;
    const result = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), phone = COALESCE($3, phone),
       timezone = COALESCE($4, timezone), avatar_url = COALESCE($5, avatar_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING id, email, name, role, bio, avatar_url, phone, timezone, created_at, updated_at`,
      [name, bio, phone, timezone, avatar_url, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /profile/password:
 *   put:
 *     summary: Change password
 *     tags: [Profile]
 */
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.userId]);
    const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, req.userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
