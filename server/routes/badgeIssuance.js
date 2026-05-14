// Badge / credential issuance: track completion, issue digital credentials.
// v0 emits an Open Badges 3.0 (VC-style) JSON; signing requires keys.
const crypto = require('crypto');
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');

const ISSUER = process.env.BADGE_ISSUER_URL || 'https://education.example.com';
const SIGNING_KEY = process.env.BADGE_SIGNING_KEY; // TODO: configure credentials

// POST /api/badges/issue { recipient_user_id, badge_id, criteria_url? }
router.post('/issue', auth, async (req, res) => {
  try {
    const { recipient_user_id, badge_id, criteria_url } = req.body || {};
    if (!recipient_user_id || !badge_id) return res.status(400).json({ error: 'recipient_user_id + badge_id required' });
    const recipient = await pool.query(`SELECT email FROM users WHERE id = $1`, [recipient_user_id]).catch(() => ({ rows: [] }));
    const email = recipient.rows[0]?.email;
    if (!email) return res.status(404).json({ error: 'recipient not found' });

    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/openbadges/v3'],
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      id: `urn:uuid:${crypto.randomUUID()}`,
      issuer: ISSUER,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: `mailto:${email}`,
        achievement: { id: `urn:badge:${badge_id}`, criteria: { id: criteria_url || `${ISSUER}/badges/${badge_id}` } },
      },
    };
    if (SIGNING_KEY) {
      credential.proof = {
        type: 'HmacSha256',
        created: new Date().toISOString(),
        proofValue: crypto.createHmac('sha256', SIGNING_KEY).update(JSON.stringify(credential)).digest('hex'),
      };
    }

    let id = null;
    try {
      const r = await pool.query(
        `INSERT INTO badges_issued (user_id, badge_id, credential, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id`,
        [recipient_user_id, badge_id, JSON.stringify(credential)]
      );
      id = r.rows[0].id;
    } catch {}

    return res.json({ id, credential, signed: !!SIGNING_KEY });
  } catch (e) {
    return res.status(500).json({ error: 'issue failed' });
  }
});

// GET /api/badges/user/:user_id
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM badges_issued WHERE user_id = $1 ORDER BY created_at DESC`, [req.params.user_id]);
    return res.json({ user_id: req.params.user_id, count: r.rows.length, badges: r.rows });
  } catch (e) {
    return res.status(500).json({ error: 'lookup failed' });
  }
});

module.exports = router;
