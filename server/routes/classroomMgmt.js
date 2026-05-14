// Apply pass 5 — Classroom roster, gradebook, attendance
//
// PRODUCT-DECISION: schemas mirror typical K-12 SIS conventions (single
// teacher per class, integer roster slots, point-based gradebook entries
// 0-100, attendance status enum present|absent|tardy|excused). Tables are
// additive (CREATE TABLE IF NOT EXISTS) so older deployments are unaffected.
//
// All endpoints require auth. No external creds required.
const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');

let initPromise = null;
async function ensureSchema() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        teacher_id INTEGER,
        subject VARCHAR(100),
        grade_level VARCHAR(20),
        capacity INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS classroom_roster (
        id SERIAL PRIMARY KEY,
        classroom_id INTEGER NOT NULL,
        student_user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (classroom_id, student_user_id)
      );
      CREATE TABLE IF NOT EXISTS gradebook_entries (
        id SERIAL PRIMARY KEY,
        classroom_id INTEGER NOT NULL,
        student_user_id INTEGER NOT NULL,
        assignment_name VARCHAR(200) NOT NULL,
        score NUMERIC(5,2),
        max_score NUMERIC(5,2) DEFAULT 100,
        graded_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        classroom_id INTEGER NOT NULL,
        student_user_id INTEGER NOT NULL,
        attendance_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (classroom_id, student_user_id, attendance_date)
      );
    `);
  })().catch((e) => { initPromise = null; throw e; });
  return initPromise;
}

// Classrooms ------------------------------------------------------
router.get('/classrooms', auth, async (req, res) => {
  try {
    await ensureSchema();
    const r = await pool.query('SELECT * FROM classrooms ORDER BY id DESC LIMIT 200');
    res.json({ classrooms: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/classrooms', auth, async (req, res) => {
  try {
    await ensureSchema();
    const { name, subject, grade_level, capacity } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      'INSERT INTO classrooms (name, teacher_id, subject, grade_level, capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, req.userId, subject || null, grade_level || null, capacity || 30]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Roster ----------------------------------------------------------
router.get('/classrooms/:id/roster', auth, async (req, res) => {
  try {
    await ensureSchema();
    const r = await pool.query('SELECT * FROM classroom_roster WHERE classroom_id=$1 ORDER BY id', [req.params.id]);
    res.json({ roster: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/classrooms/:id/roster', auth, async (req, res) => {
  try {
    await ensureSchema();
    const { student_user_id } = req.body || {};
    if (!student_user_id) return res.status(400).json({ error: 'student_user_id required' });
    const r = await pool.query(
      'INSERT INTO classroom_roster (classroom_id, student_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *',
      [req.params.id, student_user_id]
    );
    res.json(r.rows[0] || { ok: true, note: 'already enrolled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Gradebook -------------------------------------------------------
router.get('/classrooms/:id/gradebook', auth, async (req, res) => {
  try {
    await ensureSchema();
    const r = await pool.query('SELECT * FROM gradebook_entries WHERE classroom_id=$1 ORDER BY graded_at DESC LIMIT 500', [req.params.id]);
    res.json({ entries: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/classrooms/:id/gradebook', auth, async (req, res) => {
  try {
    await ensureSchema();
    const { student_user_id, assignment_name, score, max_score, notes } = req.body || {};
    if (!student_user_id || !assignment_name) {
      return res.status(400).json({ error: 'student_user_id and assignment_name required' });
    }
    const r = await pool.query(
      'INSERT INTO gradebook_entries (classroom_id, student_user_id, assignment_name, score, max_score, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.params.id, student_user_id, assignment_name, score ?? null, max_score ?? 100, notes || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Attendance ------------------------------------------------------
router.get('/classrooms/:id/attendance', auth, async (req, res) => {
  try {
    await ensureSchema();
    const { date } = req.query;
    const params = [req.params.id];
    let sql = 'SELECT * FROM attendance_records WHERE classroom_id=$1';
    if (date) { sql += ' AND attendance_date=$2'; params.push(date); }
    sql += ' ORDER BY attendance_date DESC LIMIT 500';
    const r = await pool.query(sql, params);
    res.json({ records: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/classrooms/:id/attendance', auth, async (req, res) => {
  try {
    await ensureSchema();
    const { student_user_id, attendance_date, status, notes } = req.body || {};
    if (!student_user_id || !attendance_date) {
      return res.status(400).json({ error: 'student_user_id and attendance_date required' });
    }
    const allowed = ['present', 'absent', 'tardy', 'excused'];
    const st = allowed.includes(status) ? status : 'present';
    const r = await pool.query(
      `INSERT INTO attendance_records (classroom_id, student_user_id, attendance_date, status, notes)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (classroom_id, student_user_id, attendance_date)
       DO UPDATE SET status=EXCLUDED.status, notes=EXCLUDED.notes
       RETURNING *`,
      [req.params.id, student_user_id, attendance_date, st, notes || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
