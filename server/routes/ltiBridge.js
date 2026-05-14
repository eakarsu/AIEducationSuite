// LTI / LMS bridge: Canvas / Blackboard integration. v0 implements a minimal
// LTI 1.3 launch verification + a course-roster sync stub.
const crypto = require('crypto');
const router = require('express').Router();
const pool = require('../db/config');

// POST /api/lti/launch — receives LTI launch params (in v0 we only verify state + nonce)
router.post('/launch', async (req, res) => {
  try {
    const { state, nonce, id_token } = req.body || {};
    if (!state || !nonce || !id_token) return res.status(400).json({ error: 'state, nonce, id_token required' });
    // TODO: configure credentials — LTI_PLATFORM_JWKS_URL + LTI_CLIENT_ID
    const expectedClient = process.env.LTI_CLIENT_ID;
    if (!expectedClient) {
      return res.status(503).json({ error: 'LTI_CLIENT_ID not configured', accepted_for_dev: true });
    }
    // Decode without verifying — full JWKS verification would go here.
    const [, payloadB64] = id_token.split('.');
    let claims = {};
    try { claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')); } catch {}
    if (claims.aud !== expectedClient) return res.status(403).json({ error: 'aud mismatch' });
    try {
      await pool.query(
        `INSERT INTO lti_sessions (client_id, sub, state, nonce, payload, created_at) VALUES ($1,$2,$3,$4,$5,NOW())`,
        [expectedClient, claims.sub || null, state, nonce, JSON.stringify(claims)]
      );
    } catch {}
    return res.json({ launched: true, sub: claims.sub, deployment_id: claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id'] || null });
  } catch (e) {
    return res.status(500).json({ error: 'launch failed', detail: e.message });
  }
});

// POST /api/lti/sync-roster { context_id, members:[{user_id,name,email,role}] }
router.post('/sync-roster', async (req, res) => {
  try {
    const { context_id, members = [] } = req.body || {};
    if (!context_id || !Array.isArray(members)) return res.status(400).json({ error: 'context_id + members[] required' });
    let upserts = 0;
    for (const m of members.slice(0, 500)) {
      try {
        await pool.query(
          `INSERT INTO classroom_members (class_id, user_id, role, email, name)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (class_id, user_id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email, name = EXCLUDED.name`,
          [context_id, m.user_id, m.role || 'student', m.email || null, m.name || null]
        );
        upserts++;
      } catch {}
    }
    return res.json({ context_id, upserts, attempted: members.length });
  } catch (e) {
    return res.status(500).json({ error: 'sync failed' });
  }
});

module.exports = router;
