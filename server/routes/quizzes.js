const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const openRouter = require('../services/openrouter');

const router = express.Router();

// Get all quizzes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quizzes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single quiz
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new quiz with AI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, subject, difficulty, source_content, num_questions } = req.body;

    if (!title || !subject || !difficulty) {
      return res.status(400).json({ error: 'Title, subject, and difficulty are required' });
    }

    const questionCount = num_questions || 10;

    // Generate quiz with OpenRouter AI
    const aiResult = await openRouter.generateQuiz(title, subject, difficulty, source_content, questionCount);

    let questions = null;
    let aiResponse = null;

    if (aiResult.success && aiResult.data) {
      questions = JSON.stringify(aiResult.data.questions || aiResult.data);
      aiResponse = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `INSERT INTO quizzes (user_id, title, subject, difficulty, source_content, num_questions, questions, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.userId, title, subject, difficulty, source_content, questionCount, questions, aiResponse]
    );

    res.status(201).json({
      quiz: result.rows[0],
      aiAnalysis: aiResult.success ? aiResult.data : null,
      aiError: aiResult.success ? null : aiResult.error
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update quiz
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, subject, difficulty, source_content, num_questions } = req.body;

    // Check ownership
    const check = await pool.query(
      'SELECT id FROM quizzes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    let aiResult = null;
    let updateData = { title, subject, difficulty, source_content, num_questions };

    // Regenerate quiz if parameters changed
    if (title && subject && difficulty) {
      const questionCount = num_questions || 10;
      aiResult = await openRouter.generateQuiz(title, subject, difficulty, source_content, questionCount);

      if (aiResult.success && aiResult.data) {
        updateData.questions = JSON.stringify(aiResult.data.questions || aiResult.data);
        updateData.ai_response = JSON.stringify(aiResult.data);
      }
    }

    const result = await pool.query(
      `UPDATE quizzes SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        difficulty = COALESCE($3, difficulty),
        source_content = COALESCE($4, source_content),
        num_questions = COALESCE($5, num_questions),
        questions = COALESCE($6, questions),
        ai_response = COALESCE($7, ai_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        updateData.title,
        updateData.subject,
        updateData.difficulty,
        updateData.source_content,
        updateData.num_questions,
        updateData.questions,
        updateData.ai_response,
        req.params.id,
        req.userId
      ]
    );

    res.json({
      quiz: result.rows[0],
      aiAnalysis: aiResult?.success ? aiResult.data : null
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete quiz
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM quizzes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate quiz with AI
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
  try {
    const quiz = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (quiz.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { title, subject, difficulty, source_content, num_questions } = quiz.rows[0];
    const aiResult = await openRouter.generateQuiz(title, subject, difficulty, source_content, num_questions || 10);

    if (aiResult.success && aiResult.data) {
      await pool.query(
        `UPDATE quizzes SET
          questions = $1, ai_response = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [
          JSON.stringify(aiResult.data.questions || aiResult.data),
          JSON.stringify(aiResult.data),
          req.params.id
        ]
      );

      const updated = await pool.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
      res.json({ quiz: updated.rows[0], aiAnalysis: aiResult.data });
    } else {
      res.status(500).json({ error: aiResult.error || 'AI generation failed' });
    }
  } catch (error) {
    console.error('Error regenerating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
