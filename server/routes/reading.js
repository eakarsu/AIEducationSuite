const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const openRouter = require('../services/openrouter');

const router = express.Router();

// Get all reading analyses for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reading_analyses WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reading analyses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single reading analysis
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reading_analyses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching reading analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new reading analysis with AI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Analyze reading level with OpenRouter AI
    const aiResult = await openRouter.analyzeReadingLevel(title, content);

    let readingLevel = null;
    let gradeLevel = null;
    let difficultyScore = null;
    let vocabularyComplexity = null;
    let sentenceComplexity = null;
    let recommendations = null;
    let aiResponse = null;

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      readingLevel = data.readingLevel || null;
      gradeLevel = data.gradeLevel || null;
      difficultyScore = data.difficultyScore || null;
      vocabularyComplexity = data.vocabularyAnalysis?.complexity || data.metrics?.vocabularyLevel || null;
      sentenceComplexity = data.sentenceAnalysis?.complexity || null;
      recommendations = Array.isArray(data.recommendations) ? data.recommendations.join('; ') : data.recommendations;
      aiResponse = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `INSERT INTO reading_analyses (user_id, title, content, reading_level, grade_level, difficulty_score, vocabulary_complexity, sentence_complexity, recommendations, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.userId, title, content, readingLevel, gradeLevel, difficultyScore, vocabularyComplexity, sentenceComplexity, recommendations, aiResponse]
    );

    res.status(201).json({
      analysis: result.rows[0],
      aiAnalysis: aiResult.success ? aiResult.data : null,
      aiError: aiResult.success ? null : aiResult.error
    });
  } catch (error) {
    console.error('Error creating reading analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update reading analysis
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Check ownership
    const check = await pool.query(
      'SELECT id FROM reading_analyses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Reading analysis not found' });
    }

    let aiResult = null;
    let updateData = { title, content };

    // Re-analyze if content changed
    if (content && title) {
      aiResult = await openRouter.analyzeReadingLevel(title, content);

      if (aiResult.success && aiResult.data) {
        const data = aiResult.data;
        updateData.reading_level = data.readingLevel;
        updateData.grade_level = data.gradeLevel;
        updateData.difficulty_score = data.difficultyScore;
        updateData.vocabulary_complexity = data.vocabularyAnalysis?.complexity || data.metrics?.vocabularyLevel;
        updateData.sentence_complexity = data.sentenceAnalysis?.complexity;
        updateData.recommendations = Array.isArray(data.recommendations) ? data.recommendations.join('; ') : data.recommendations;
        updateData.ai_response = JSON.stringify(data);
      }
    }

    const result = await pool.query(
      `UPDATE reading_analyses SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        reading_level = COALESCE($3, reading_level),
        grade_level = COALESCE($4, grade_level),
        difficulty_score = COALESCE($5, difficulty_score),
        vocabulary_complexity = COALESCE($6, vocabulary_complexity),
        sentence_complexity = COALESCE($7, sentence_complexity),
        recommendations = COALESCE($8, recommendations),
        ai_response = COALESCE($9, ai_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        updateData.title,
        updateData.content,
        updateData.reading_level,
        updateData.grade_level,
        updateData.difficulty_score,
        updateData.vocabulary_complexity,
        updateData.sentence_complexity,
        updateData.recommendations,
        updateData.ai_response,
        req.params.id,
        req.userId
      ]
    );

    res.json({
      analysis: result.rows[0],
      aiAnalysis: aiResult?.success ? aiResult.data : null
    });
  } catch (error) {
    console.error('Error updating reading analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete reading analysis
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM reading_analyses WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading analysis not found' });
    }

    res.json({ message: 'Reading analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting reading analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/reanalyze', authMiddleware, async (req, res) => {
  try {
    const analysis = await pool.query(
      'SELECT * FROM reading_analyses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (analysis.rows.length === 0) {
      return res.status(404).json({ error: 'Reading analysis not found' });
    }

    const { title, content } = analysis.rows[0];
    const aiResult = await openRouter.analyzeReadingLevel(title, content);

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      await pool.query(
        `UPDATE reading_analyses SET
          reading_level = $1, grade_level = $2, difficulty_score = $3,
          vocabulary_complexity = $4, sentence_complexity = $5,
          recommendations = $6, ai_response = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          data.readingLevel,
          data.gradeLevel,
          data.difficultyScore,
          data.vocabularyAnalysis?.complexity || data.metrics?.vocabularyLevel,
          data.sentenceAnalysis?.complexity,
          Array.isArray(data.recommendations) ? data.recommendations.join('; ') : data.recommendations,
          JSON.stringify(data),
          req.params.id
        ]
      );

      const updated = await pool.query('SELECT * FROM reading_analyses WHERE id = $1', [req.params.id]);
      res.json({ analysis: updated.rows[0], aiAnalysis: data });
    } else {
      res.status(500).json({ error: aiResult.error || 'AI analysis failed' });
    }
  } catch (error) {
    console.error('Error reanalyzing:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
