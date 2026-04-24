const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db/config');
const { sendPasswordResetEmail } = require('../services/email');

const router = express.Router();

/**
 * @swagger
 * /password-reset/forgot:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 */
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always return success to prevent email enumeration
    if (user.rows.length === 0) {
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, token, expiresAt]
    );

    await sendPasswordResetEmail(email, token);
    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /password-reset/reset:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 */
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetToken = result.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, resetToken.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetToken.id]);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
