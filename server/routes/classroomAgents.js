const router = require('express').Router();
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const openrouter = require('../services/openrouter');

/**
 * Classroom AI agents — refactored to use the centralized OpenRouter service
 * with the 3-strategy JSON parser. No more inline https.request.
 */
async function ai(prompt, systemPrompt = 'You are an AI classroom assistant. Always respond in valid JSON.') {
  const response = await openrouter.makeRequest(
    [{ role: 'user', content: prompt }],
    systemPrompt
  );
  const content = response.choices?.[0]?.message?.content || '';
  const parsed = openrouter.parseJsonResponse(content);
  return parsed?.parseError ? { analysis: content, _parseError: parsed.parseError } : parsed;
}

router.post('/adaptive-lesson', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subject, student_level, learning_style } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required' });

    const systemPrompt = 'You are an expert curriculum designer creating personalized lessons. Always respond in valid JSON format.';
    const prompt = `Generate a personalized lesson plan.
Subject: ${subject}
Student Level: ${student_level || 'intermediate'}
Learning Style: ${learning_style || 'visual'}

Return JSON: {
  "lesson_title": "string",
  "learning_objectives": ["obj1", "obj2"],
  "teaching_approach": "description",
  "content_sections": [
    {"section_title": "string", "content": "string", "activity_type": "string", "duration_minutes": 15}
  ],
  "practice_exercises": [{"exercise": "string", "difficulty": "string", "hints": ["hint1"]}],
  "assessment_questions": [{"question": "string", "type": "string"}],
  "adaptation_notes": "why customized this way"
}`;

    const result = await ai(prompt, systemPrompt);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/assess-understanding', auth, aiRateLimiter, async (req, res) => {
  try {
    const { topic, student_response, student_level } = req.body;
    if (!topic || !student_response) {
      return res.status(400).json({ error: 'topic and student_response are required' });
    }

    const systemPrompt = 'You are an expert educator evaluating student comprehension. Always respond in valid JSON.';
    const prompt = `Evaluate student understanding.
Topic: ${topic}
Student Level: ${student_level || 'beginner'}
Student's Response: ${student_response}

Return JSON: {
  "comprehension_level": "novice|developing|proficient|advanced",
  "score": 75,
  "strengths_demonstrated": ["str1"],
  "knowledge_gaps": ["gap1"],
  "detailed_feedback": "feedback",
  "next_steps": ["step1"],
  "suggested_review_topics": ["topic1"]
}`;

    const result = await ai(prompt, systemPrompt);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/personalized-tutor', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subject, question, learning_style } = req.body;
    if (!subject || !question) {
      return res.status(400).json({ error: 'subject and question are required' });
    }

    const systemPrompt = 'You are a patient personal tutor adapted to the student learning style. Always respond in valid JSON.';
    const prompt = `Help the student understand a question.
Learning Style: ${learning_style || 'visual'}
Subject: ${subject}
Question: ${question}

Return JSON: {
  "explanation": "clear explanation",
  "key_concepts": ["c1","c2"],
  "analogies": ["analogy1"],
  "step_by_step": ["step1","step2"],
  "practice_problems": [{"problem": "string", "hint": "string", "solution": "string"}],
  "common_mistakes": ["mistake1"],
  "follow_up_questions": ["q1"]
}`;

    const result = await ai(prompt, systemPrompt);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
