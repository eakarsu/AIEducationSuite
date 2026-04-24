const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const ai = async (prompt) => {
  const r = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  const c = r.data.choices[0].message.content;
  try { return JSON.parse(c); } catch { return { analysis: c }; }
};

router.post('/adaptive-lesson', auth, async (req, res) => {
  try {
    const { subject, student_level, learning_style } = req.body;
    const result = await ai(`Generate a personalized lesson plan. Subject: ${subject}. Student Level: ${student_level || 'intermediate'}. Learning Style: ${learning_style || 'visual'}. Return JSON: {"lesson_title": "string", "learning_objectives": ["obj1", "obj2"], "teaching_approach": "description", "content_sections": [{"section_title": "string", "content": "string", "activity_type": "string", "duration_minutes": 15}], "practice_exercises": [{"exercise": "string", "difficulty": "string", "hints": ["hint1"]}], "assessment_questions": [{"question": "string", "type": "string"}], "adaptation_notes": "why customized this way"}`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/assess-understanding', auth, async (req, res) => {
  try {
    const { topic, student_response, student_level } = req.body;
    const result = await ai(`Evaluate student understanding. Topic: ${topic}. Student Level: ${student_level || 'beginner'}. Student's Response: ${student_response}. Return JSON: {"comprehension_level": "novice|developing|proficient|advanced", "score": 75, "strengths_demonstrated": ["str1"], "knowledge_gaps": ["gap1"], "detailed_feedback": "feedback", "next_steps": ["step1"], "suggested_review_topics": ["topic1"]}`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/personalized-tutor', auth, async (req, res) => {
  try {
    const { subject, question, learning_style } = req.body;
    const result = await ai(`AI tutor help. Learning Style: ${learning_style || 'visual'}. Subject: ${subject}. Question: ${question}. Return JSON: {"explanation": "clear explanation", "key_concepts": ["c1","c2"], "analogies": ["analogy1"], "step_by_step": ["step1","step2"], "practice_problems": [{"problem": "string", "hint": "string", "solution": "string"}], "common_mistakes": ["mistake1"], "follow_up_questions": ["q1"]}`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
