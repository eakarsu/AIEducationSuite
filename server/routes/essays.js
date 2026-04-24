const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const openRouter = require('../services/openrouter');

const router = express.Router();

// Get all essays for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM essays WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching essays:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single essay
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM essays WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Essay not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching essay:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new essay and grade with AI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Grade essay with OpenRouter AI
    const aiResult = await openRouter.gradeEssay(title, content);

    let grade = null;
    let score = null;
    let feedback = null;
    let strengths = null;
    let improvements = null;
    let grammarIssues = null;
    let aiResponse = null;

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      grade = data.grade || null;
      score = data.score || null;
      feedback = data.feedback || null;
      strengths = Array.isArray(data.strengths) ? data.strengths.join('; ') : data.strengths;
      improvements = Array.isArray(data.improvements) ? data.improvements.join('; ') : data.improvements;
      grammarIssues = Array.isArray(data.grammarIssues) ? data.grammarIssues.join('; ') : data.grammarIssues;
      aiResponse = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `INSERT INTO essays (user_id, title, content, grade, score, feedback, strengths, improvements, grammar_issues, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.userId, title, content, grade, score, feedback, strengths, improvements, grammarIssues, aiResponse]
    );

    res.status(201).json({
      essay: result.rows[0],
      aiAnalysis: aiResult.success ? aiResult.data : null,
      aiError: aiResult.success ? null : aiResult.error
    });
  } catch (error) {
    console.error('Error creating essay:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update essay
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Check ownership
    const check = await pool.query(
      'SELECT id FROM essays WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Essay not found' });
    }

    // Re-grade if content changed
    let updateFields = { title, updated_at: new Date() };
    let aiResult = null;

    if (content) {
      updateFields.content = content;
      aiResult = await openRouter.gradeEssay(title, content);

      if (aiResult.success && aiResult.data) {
        const data = aiResult.data;
        updateFields.grade = data.grade;
        updateFields.score = data.score;
        updateFields.feedback = data.feedback;
        updateFields.strengths = Array.isArray(data.strengths) ? data.strengths.join('; ') : data.strengths;
        updateFields.improvements = Array.isArray(data.improvements) ? data.improvements.join('; ') : data.improvements;
        updateFields.grammar_issues = Array.isArray(data.grammarIssues) ? data.grammarIssues.join('; ') : data.grammarIssues;
        updateFields.ai_response = JSON.stringify(aiResult.data);
      }
    }

    const result = await pool.query(
      `UPDATE essays SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        grade = COALESCE($3, grade),
        score = COALESCE($4, score),
        feedback = COALESCE($5, feedback),
        strengths = COALESCE($6, strengths),
        improvements = COALESCE($7, improvements),
        grammar_issues = COALESCE($8, grammar_issues),
        ai_response = COALESCE($9, ai_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        updateFields.title,
        updateFields.content,
        updateFields.grade,
        updateFields.score,
        updateFields.feedback,
        updateFields.strengths,
        updateFields.improvements,
        updateFields.grammar_issues,
        updateFields.ai_response,
        req.params.id,
        req.userId
      ]
    );

    res.json({
      essay: result.rows[0],
      aiAnalysis: aiResult?.success ? aiResult.data : null
    });
  } catch (error) {
    console.error('Error updating essay:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete essay
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM essays WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Essay not found' });
    }

    res.json({ message: 'Essay deleted successfully' });
  } catch (error) {
    console.error('Error deleting essay:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-grade essay with AI
router.post('/:id/regrade', authMiddleware, async (req, res) => {
  try {
    const essay = await pool.query(
      'SELECT * FROM essays WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (essay.rows.length === 0) {
      return res.status(404).json({ error: 'Essay not found' });
    }

    const { title, content } = essay.rows[0];
    const aiResult = await openRouter.gradeEssay(title, content);

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      await pool.query(
        `UPDATE essays SET
          grade = $1, score = $2, feedback = $3, strengths = $4,
          improvements = $5, grammar_issues = $6, ai_response = $7,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          data.grade,
          data.score,
          data.feedback,
          Array.isArray(data.strengths) ? data.strengths.join('; ') : data.strengths,
          Array.isArray(data.improvements) ? data.improvements.join('; ') : data.improvements,
          Array.isArray(data.grammarIssues) ? data.grammarIssues.join('; ') : data.grammarIssues,
          JSON.stringify(data),
          req.params.id
        ]
      );

      const updated = await pool.query('SELECT * FROM essays WHERE id = $1', [req.params.id]);
      res.json({ essay: updated.rows[0], aiAnalysis: data });
    } else {
      res.status(500).json({ error: aiResult.error || 'AI grading failed' });
    }
  } catch (error) {
    console.error('Error regrading essay:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
