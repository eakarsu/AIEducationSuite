const express = require('express');

const router = express.Router();

router.post('/plan', (req, res) => {
  const {
    quizScore = 0,
    attempts = 1,
    missedStandards = [],
    daysSincePractice = 0,
    confidence = 3,
  } = req.body || {};

  const scoreGap = Math.max(0, 80 - (Number(quizScore) || 0));
  const standardPenalty = Array.isArray(missedStandards) ? missedStandards.length * 9 : 0;
  const riskScore = Math.min(100, Math.round(
    scoreGap * 0.9 +
    (Number(attempts) || 1) * 7 +
    standardPenalty +
    (Number(daysSincePractice) || 0) * 1.5 +
    Math.max(0, 5 - (Number(confidence) || 0)) * 8
  ));

  const nextMoves = [
    riskScore >= 65 && 'Assign a teacher-led mini lesson before the next adaptive quiz.',
    standardPenalty > 0 && `Create targeted practice for ${missedStandards.slice(0, 3).join(', ')}.`,
    (Number(confidence) || 0) < 3 && 'Add confidence-building worked examples before independent practice.',
    (Number(daysSincePractice) || 0) > 5 && 'Schedule a spaced repetition review within 24 hours.',
  ].filter(Boolean);

  res.json({
    feature: 'mastery_intervention',
    riskScore,
    tier: riskScore >= 70 ? 'intensive' : riskScore >= 40 ? 'targeted' : 'monitor',
    nextMoves: nextMoves.length ? nextMoves : ['Continue standard adaptive practice.'],
  });
});

module.exports = router;
