const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const openRouter = require('../services/openrouter');

const router = express.Router();

// Get all music lessons for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM music_lessons WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching music lessons:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single music lesson
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM music_lessons WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Music lesson not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching music lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new music lesson with AI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { instrument, skill_level, topic } = req.body;

    if (!instrument || !skill_level || !topic) {
      return res.status(400).json({ error: 'Instrument, skill level, and topic are required' });
    }

    // Generate lesson with OpenRouter AI
    const aiResult = await openRouter.generateMusicLesson(instrument, skill_level, topic);

    let lessonContent = null;
    let practiceExercises = null;
    let tips = null;
    let aiResponse = null;

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      lessonContent = JSON.stringify(data.mainContent) || null;
      practiceExercises = JSON.stringify(data.exercises) || null;
      tips = Array.isArray(data.tips) ? data.tips.join('; ') : data.tips;
      aiResponse = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `INSERT INTO music_lessons (user_id, instrument, skill_level, topic, lesson_content, practice_exercises, tips, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.userId, instrument, skill_level, topic, lessonContent, practiceExercises, tips, aiResponse]
    );

    res.status(201).json({
      lesson: result.rows[0],
      aiAnalysis: aiResult.success ? aiResult.data : null,
      aiError: aiResult.success ? null : aiResult.error
    });
  } catch (error) {
    console.error('Error creating music lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update music lesson
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { instrument, skill_level, topic, progress_notes } = req.body;

    // Check ownership
    const check = await pool.query(
      'SELECT id FROM music_lessons WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Music lesson not found' });
    }

    let aiResult = null;
    let updateData = { instrument, skill_level, topic, progress_notes };

    // Regenerate lesson if topic changed
    if (topic && instrument && skill_level) {
      aiResult = await openRouter.generateMusicLesson(instrument, skill_level, topic);

      if (aiResult.success && aiResult.data) {
        const data = aiResult.data;
        updateData.lesson_content = JSON.stringify(data.mainContent);
        updateData.practice_exercises = JSON.stringify(data.exercises);
        updateData.tips = Array.isArray(data.tips) ? data.tips.join('; ') : data.tips;
        updateData.ai_response = JSON.stringify(data);
      }
    }

    const result = await pool.query(
      `UPDATE music_lessons SET
        instrument = COALESCE($1, instrument),
        skill_level = COALESCE($2, skill_level),
        topic = COALESCE($3, topic),
        lesson_content = COALESCE($4, lesson_content),
        practice_exercises = COALESCE($5, practice_exercises),
        tips = COALESCE($6, tips),
        progress_notes = COALESCE($7, progress_notes),
        ai_response = COALESCE($8, ai_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        updateData.instrument,
        updateData.skill_level,
        updateData.topic,
        updateData.lesson_content,
        updateData.practice_exercises,
        updateData.tips,
        updateData.progress_notes,
        updateData.ai_response,
        req.params.id,
        req.userId
      ]
    );

    res.json({
      lesson: result.rows[0],
      aiAnalysis: aiResult?.success ? aiResult.data : null
    });
  } catch (error) {
    console.error('Error updating music lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete music lesson
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM music_lessons WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Music lesson not found' });
    }

    res.json({ message: 'Music lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting music lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate lesson with AI
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
  try {
    const lesson = await pool.query(
      'SELECT * FROM music_lessons WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (lesson.rows.length === 0) {
      return res.status(404).json({ error: 'Music lesson not found' });
    }

    const { instrument, skill_level, topic } = lesson.rows[0];
    const aiResult = await openRouter.generateMusicLesson(instrument, skill_level, topic);

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      await pool.query(
        `UPDATE music_lessons SET
          lesson_content = $1, practice_exercises = $2, tips = $3,
          ai_response = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          JSON.stringify(data.mainContent),
          JSON.stringify(data.exercises),
          Array.isArray(data.tips) ? data.tips.join('; ') : data.tips,
          JSON.stringify(data),
          req.params.id
        ]
      );

      const updated = await pool.query('SELECT * FROM music_lessons WHERE id = $1', [req.params.id]);
      res.json({ lesson: updated.rows[0], aiAnalysis: data });
    } else {
      res.status(500).json({ error: aiResult.error || 'AI generation failed' });
    }
  } catch (error) {
    console.error('Error regenerating music lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
