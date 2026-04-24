const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Get audit logs (admin only)
 *     tags: [AuditLogs]
 */
router.get('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { action, entity_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT a.*, u.name as user_name, u.email as user_email
                 FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (action) {
      paramCount++;
      query += ` AND a.action = $${paramCount}`;
      params.push(action);
    }
    if (entity_type) {
      paramCount++;
      query += ` AND a.entity_type = $${paramCount}`;
      params.push(entity_type);
    }

    const countQuery = query.replace('SELECT a.*, u.name as user_name, u.email as user_email', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    paramCount++;
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
