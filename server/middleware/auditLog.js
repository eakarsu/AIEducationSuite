const pool = require('../db/config');

const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try {
        if (req.userId && res.statusCode < 400) {
          await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.userId, action, entityType, req.params.id || null, req.ip]
          );
        }
      } catch (err) {
        // Don't block the response if audit logging fails
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = auditLog;
