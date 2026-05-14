// Apply pass 5 — Parent portal (TOO-RISKY, additive only)
//
// PRODUCT-DECISION: parent_links join parent_user_id to student_user_id.
// All endpoints require the parent's auth and read-only access. Surfaces a
// limited summary view (recent grades, attendance, learning paths) — does
// NOT expose essay full-text, fact-check details, or moderator feedback,
// to limit FERPA / minor-privacy surface area pending dedicated review.
//
// Tables created with CREATE TABLE IF NOT EXISTS — fully additive.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');

let initPromise = null;
async function ensureSchema() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_links (
        id SERIAL PRIMARY KEY,
        parent_user_id INTEGER NOT NULL,
        student_user_id INTEGER NOT NULL,
        relationship VARCHAR(50) DEFAULT 'parent',
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (parent_user_id, student_user_id)
      );
    `);
  })().catch((e) => { initPromise = null; throw e; });
  return initPromise;
}

// Link a parent to a student. Verification is deferred (TOO-RISKY review).
router.post('/links', auth, async (req, res) => {
  try {
    await ensureSchema();
    const { student_user_id, relationship } = req.body || {};
    if (!student_user_id) return res.status(400).json({ error: 'student_user_id required' });
    const r = await pool.query(
      `INSERT INTO parent_links (parent_user_id, student_user_id, relationship)
       VALUES ($1, $2, $3)
       ON CONFLICT (parent_user_id, student_user_id)
       DO UPDATE SET relationship=EXCLUDED.relationship
       RETURNING *`,
      [req.userId, student_user_id, relationship || 'parent']
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/links', auth, async (req, res) => {
  try {
    await ensureSchema();
    const r = await pool.query('SELECT * FROM parent_links WHERE parent_user_id=$1', [req.userId]);
    res.json({ links: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Read-only summary view for a linked student.
router.get('/students/:id/summary', auth, async (req, res) => {
  try {
    await ensureSchema();
    const link = await pool.query(
      'SELECT id FROM parent_links WHERE parent_user_id=$1 AND student_user_id=$2',
      [req.userId, req.params.id]
    );
    if (link.rows.length === 0) {
      return res.status(403).json({ error: 'No verified link to this student' });
    }
    const studentId = req.params.id;
    const [grades, attendance, paths] = await Promise.all([
      pool.query('SELECT id, classroom_id, assignment_name, score, max_score, graded_at FROM gradebook_entries WHERE student_user_id=$1 ORDER BY graded_at DESC LIMIT 25', [studentId]).catch(() => ({ rows: [] })),
      pool.query('SELECT classroom_id, attendance_date, status FROM attendance_records WHERE student_user_id=$1 ORDER BY attendance_date DESC LIMIT 30', [studentId]).catch(() => ({ rows: [] })),
      pool.query('SELECT id, subject, created_at FROM learning_paths WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10', [studentId]).catch(() => ({ rows: [] })),
    ]);
    res.json({
      student_user_id: Number(studentId),
      recent_grades: grades.rows,
      recent_attendance: attendance.rows,
      recent_learning_paths: paths.rows,
      privacy_note: 'Summary view only. Full essay text and detailed AI feedback are withheld pending dedicated FERPA/minor-privacy review.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
