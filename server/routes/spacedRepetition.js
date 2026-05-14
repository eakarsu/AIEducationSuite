const router = require('express').Router();
const pool = require('../db/config');
const auth = require('../middleware/auth');

// SM-2 algorithm: calculate next interval based on quality (0-5 scale, 1=correct, 0=wrong)
function sm2(item, correct) {
  let { interval_days, ease_factor, repetitions } = item;

  if (correct) {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
    ease_factor = Math.max(1.3, ease_factor + 0.1);
  } else {
    repetitions = 0;
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  }

  const next_review_date = new Date();
  next_review_date.setDate(next_review_date.getDate() + interval_days);

  return { interval_days, ease_factor, repetitions, next_review_date };
}

// Ensure spaced_repetition_items table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS spaced_repetition_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      next_review_date TIMESTAMP NOT NULL DEFAULT NOW(),
      interval_days INTEGER NOT NULL DEFAULT 1,
      ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// POST /api/spaced-repetition/schedule
// Body: { quiz_id, results: [{ question_id, correct }] }
router.post('/schedule', auth, async (req, res) => {
  try {
    await ensureTable();
    const { quiz_id, results } = req.body;
    if (!quiz_id || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'quiz_id and results[] are required' });
    }

    const user_id = req.userId;
    const created = [];

    for (const { question_id, correct } of results) {
      // Check if item already exists for this user/quiz/question
      const existing = await pool.query(
        'SELECT * FROM spaced_repetition_items WHERE user_id = $1 AND quiz_id = $2 AND question_id = $3',
        [user_id, quiz_id, question_id]
      );

      if (existing.rows.length > 0) {
        const item = existing.rows[0];
        const updated = sm2(item, !!correct);
        const row = await pool.query(
          `UPDATE spaced_repetition_items
           SET next_review_date=$1, interval_days=$2, ease_factor=$3, repetitions=$4, updated_at=NOW()
           WHERE id=$5 RETURNING *`,
          [updated.next_review_date, updated.interval_days, updated.ease_factor, updated.repetitions, item.id]
        );
        created.push(row.rows[0]);
      } else {
        const seed = { interval_days: 1, ease_factor: 2.5, repetitions: 0 };
        const computed = sm2(seed, !!correct);
        const row = await pool.query(
          `INSERT INTO spaced_repetition_items (user_id, quiz_id, question_id, next_review_date, interval_days, ease_factor, repetitions)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [user_id, quiz_id, question_id, computed.next_review_date, computed.interval_days, computed.ease_factor, computed.repetitions]
        );
        created.push(row.rows[0]);
      }
    }

    res.status(201).json({ scheduled: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/spaced-repetition/due
// Returns items due for review today for the authenticated user
router.get('/due', auth, async (req, res) => {
  try {
    await ensureTable();
    const user_id = req.userId;
    const result = await pool.query(
      `SELECT * FROM spaced_repetition_items
       WHERE user_id = $1 AND next_review_date <= NOW()
       ORDER BY next_review_date ASC`,
      [user_id]
    );
    res.json({ due: result.rows, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/spaced-repetition/review
// Body: { item_id, correct }
router.post('/review', auth, async (req, res) => {
  try {
    await ensureTable();
    const { item_id, correct } = req.body;
    if (!item_id || correct === undefined) {
      return res.status(400).json({ error: 'item_id and correct are required' });
    }

    const existing = await pool.query(
      'SELECT * FROM spaced_repetition_items WHERE id = $1 AND user_id = $2',
      [item_id, req.userId]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

    const updated = sm2(existing.rows[0], !!correct);
    const result = await pool.query(
      `UPDATE spaced_repetition_items
       SET next_review_date=$1, interval_days=$2, ease_factor=$3, repetitions=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [updated.next_review_date, updated.interval_days, updated.ease_factor, updated.repetitions, item_id]
    );

    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
