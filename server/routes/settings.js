const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Settings]
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
        [req.userId]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Settings]
 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { theme, language, notifications_enabled, email_notifications, items_per_page } = req.body;
    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, items_per_page)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = COALESCE($2, user_settings.theme),
         language = COALESCE($3, user_settings.language),
         notifications_enabled = COALESCE($4, user_settings.notifications_enabled),
         email_notifications = COALESCE($5, user_settings.email_notifications),
         items_per_page = COALESCE($6, user_settings.items_per_page),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.userId, theme, language, notifications_enabled, email_notifications, items_per_page]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
