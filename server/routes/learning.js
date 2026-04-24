const express = require('express');
const pool = require('../db/config');
const authMiddleware = require('../middleware/auth');
const openRouter = require('../services/openrouter');

const router = express.Router();

// Get all learning paths for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM learning_paths WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single learning path
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM learning_paths WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new learning path with AI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, subject, current_level, target_level, goals } = req.body;

    if (!title || !subject || !current_level || !target_level) {
      return res.status(400).json({ error: 'Title, subject, current level, and target level are required' });
    }

    // Create learning path with OpenRouter AI
    const aiResult = await openRouter.createLearningPath(title, subject, current_level, target_level, goals);

    let milestones = null;
    let resources = null;
    let timeline = null;
    let aiResponse = null;

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      milestones = JSON.stringify(data.phases || []);
      resources = JSON.stringify(data.phases?.flatMap(p => p.resources) || []);
      timeline = data.estimatedDuration || null;
      aiResponse = JSON.stringify(aiResult.data);
    }

    const result = await pool.query(
      `INSERT INTO learning_paths (user_id, title, subject, current_level, target_level, goals, milestones, resources, timeline, ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.userId, title, subject, current_level, target_level, goals, milestones, resources, timeline, aiResponse]
    );

    res.status(201).json({
      path: result.rows[0],
      aiAnalysis: aiResult.success ? aiResult.data : null,
      aiError: aiResult.success ? null : aiResult.error
    });
  } catch (error) {
    console.error('Error creating learning path:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update learning path
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, subject, current_level, target_level, goals } = req.body;

    // Check ownership
    const check = await pool.query(
      'SELECT id FROM learning_paths WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    let aiResult = null;
    let updateData = { title, subject, current_level, target_level, goals };

    // Regenerate path if parameters changed
    if (title && subject && current_level && target_level) {
      aiResult = await openRouter.createLearningPath(title, subject, current_level, target_level, goals);

      if (aiResult.success && aiResult.data) {
        const data = aiResult.data;
        updateData.milestones = JSON.stringify(data.phases || []);
        updateData.resources = JSON.stringify(data.phases?.flatMap(p => p.resources) || []);
        updateData.timeline = data.estimatedDuration;
        updateData.ai_response = JSON.stringify(data);
      }
    }

    const result = await pool.query(
      `UPDATE learning_paths SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        current_level = COALESCE($3, current_level),
        target_level = COALESCE($4, target_level),
        goals = COALESCE($5, goals),
        milestones = COALESCE($6, milestones),
        resources = COALESCE($7, resources),
        timeline = COALESCE($8, timeline),
        ai_response = COALESCE($9, ai_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        updateData.title,
        updateData.subject,
        updateData.current_level,
        updateData.target_level,
        updateData.goals,
        updateData.milestones,
        updateData.resources,
        updateData.timeline,
        updateData.ai_response,
        req.params.id,
        req.userId
      ]
    );

    res.json({
      path: result.rows[0],
      aiAnalysis: aiResult?.success ? aiResult.data : null
    });
  } catch (error) {
    console.error('Error updating learning path:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete learning path
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM learning_paths WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    res.json({ message: 'Learning path deleted successfully' });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate learning path with AI
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
  try {
    const path = await pool.query(
      'SELECT * FROM learning_paths WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (path.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const { title, subject, current_level, target_level, goals } = path.rows[0];
    const aiResult = await openRouter.createLearningPath(title, subject, current_level, target_level, goals);

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data;
      await pool.query(
        `UPDATE learning_paths SET
          milestones = $1, resources = $2, timeline = $3,
          ai_response = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          JSON.stringify(data.phases || []),
          JSON.stringify(data.phases?.flatMap(p => p.resources) || []),
          data.estimatedDuration,
          JSON.stringify(data),
          req.params.id
        ]
      );

      const updated = await pool.query('SELECT * FROM learning_paths WHERE id = $1', [req.params.id]);
      res.json({ path: updated.rows[0], aiAnalysis: data });
    } else {
      res.status(500).json({ error: aiResult.error || 'AI generation failed' });
    }
  } catch (error) {
    console.error('Error regenerating learning path:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
