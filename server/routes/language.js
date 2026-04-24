const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const openRouter = require('../services/openrouter');

const router = express.Router();

// Get all language sessions for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM language_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching language sessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single language session
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM language_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Language session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching language session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new language session with AI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { target_language, native_language, proficiency_level, topic, session_type } = req.body;

    if (!target_language || !proficiency_level || !topic) {
      return res.status(400).json({ error: 'Target language, proficiency level, and topic are required' });
    }

    const aiResult = await openRouter.generateLanguageImmersion(
      target_language,
      native_language || 'English',
      proficiency_level,
      topic,
      session_type || 'conversation'
    );

    let lesson_content = null;
    let vocabulary = null;
    let grammar_notes = null;
    let exercises = null;
    let cultural_notes = null;
    let pronunciation_guide = null;
    let aiResponse = null;

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      lesson_content = data.lessonContent || data.dialogue || null;
      vocabulary = data.vocabulary ? JSON.stringify(data.vocabulary) : null;
      grammar_notes = data.grammarNotes || data.grammarFocus || null;
      exercises = data.exercises ? JSON.stringify(data.exercises) : null;
      cultural_notes = data.culturalNotes || null;
      pronunciation_guide = data.pronunciationGuide || null;
      aiResponse = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `INSERT INTO language_sessions (user_id, target_language, native_language, proficiency_level, topic, session_type, lesson_content, vocabulary, grammar_notes, exercises, cultural_notes, pronunciation_guide, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [req.userId, target_language, native_language || 'English', proficiency_level, topic, session_type || 'conversation', lesson_content, vocabulary, grammar_notes, exercises, cultural_notes, pronunciation_guide, aiResponse]
    );

    res.status(201).json({
      session: result.rows[0],
      aiAnalysis: aiResult.success ? aiResult.data : null,
      aiError: aiResult.success ? null : aiResult.error
    });
  } catch (error) {
    console.error('Error creating language session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update language session
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { target_language, native_language, proficiency_level, topic, session_type } = req.body;

    const check = await pool.query(
      'SELECT id FROM language_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Language session not found' });
    }

    let aiResult = null;

    if (topic) {
      aiResult = await openRouter.generateLanguageImmersion(
        target_language,
        native_language || 'English',
        proficiency_level,
        topic,
        session_type || 'conversation'
      );
    }

    let updateValues = {
      target_language,
      native_language,
      proficiency_level,
      topic,
      session_type
    };

    if (aiResult?.success && aiResult.data) {
      const data = aiResult.data;
      updateValues.lesson_content = data.lessonContent || data.dialogue || null;
      updateValues.vocabulary = data.vocabulary ? JSON.stringify(data.vocabulary) : null;
      updateValues.grammar_notes = data.grammarNotes || data.grammarFocus || null;
      updateValues.exercises = data.exercises ? JSON.stringify(data.exercises) : null;
      updateValues.cultural_notes = data.culturalNotes || null;
      updateValues.pronunciation_guide = data.pronunciationGuide || null;
      updateValues.ai_response = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `UPDATE language_sessions SET
        target_language = COALESCE($1, target_language),
        native_language = COALESCE($2, native_language),
        proficiency_level = COALESCE($3, proficiency_level),
        topic = COALESCE($4, topic),
        session_type = COALESCE($5, session_type),
        lesson_content = COALESCE($6, lesson_content),
        vocabulary = COALESCE($7, vocabulary),
        grammar_notes = COALESCE($8, grammar_notes),
        exercises = COALESCE($9, exercises),
        cultural_notes = COALESCE($10, cultural_notes),
        pronunciation_guide = COALESCE($11, pronunciation_guide),
        ai_response = COALESCE($12, ai_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [
        updateValues.target_language,
        updateValues.native_language,
        updateValues.proficiency_level,
        updateValues.topic,
        updateValues.session_type,
        updateValues.lesson_content,
        updateValues.vocabulary,
        updateValues.grammar_notes,
        updateValues.exercises,
        updateValues.cultural_notes,
        updateValues.pronunciation_guide,
        updateValues.ai_response,
        req.params.id,
        req.userId
      ]
    );

    res.json({
      session: result.rows[0],
      aiAnalysis: aiResult?.success ? aiResult.data : null
    });
  } catch (error) {
    console.error('Error updating language session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete language session
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM language_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Language session not found' });
    }

    res.json({ message: 'Language session deleted successfully' });
  } catch (error) {
    console.error('Error deleting language session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate language session with AI
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
  try {
    const session = await pool.query(
      'SELECT * FROM language_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Language session not found' });
    }

    const { target_language, native_language, proficiency_level, topic, session_type } = session.rows[0];
    const aiResult = await openRouter.generateLanguageImmersion(target_language, native_language, proficiency_level, topic, session_type);

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      await pool.query(
        `UPDATE language_sessions SET
          lesson_content = $1, vocabulary = $2, grammar_notes = $3,
          exercises = $4, cultural_notes = $5, pronunciation_guide = $6,
          ai_response = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          data.lessonContent || data.dialogue || null,
          data.vocabulary ? JSON.stringify(data.vocabulary) : null,
          data.grammarNotes || data.grammarFocus || null,
          data.exercises ? JSON.stringify(data.exercises) : null,
          data.culturalNotes || null,
          data.pronunciationGuide || null,
          JSON.stringify(data),
          req.params.id
        ]
      );

      const updated = await pool.query('SELECT * FROM language_sessions WHERE id = $1', [req.params.id]);
      res.json({ session: updated.rows[0], aiAnalysis: data });
    } else {
      res.status(500).json({ error: aiResult.error || 'AI generation failed' });
    }
  } catch (error) {
    console.error('Error regenerating language session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
