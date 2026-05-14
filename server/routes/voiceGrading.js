// Apply pass 5 — Voice grading (pronunciation / music feedback)
//
// NEEDS-CREDS — gates on SPEECH_API_KEY (provider-agnostic; user wires
// AssemblyAI / Deepgram / Azure / Google STT). Returns 503 with
// `missing: SPEECH_API_KEY` until configured.
//
// ENV vars used:
//   SPEECH_API_KEY — speech recognition provider key
//   SPEECH_PROVIDER — "assemblyai" | "deepgram" | "azure" | "google" (default: assemblyai)
const router = require('express').Router();
const auth = require('../middleware/auth');

function speechKeyOr503(res) {
  const v = process.env.SPEECH_API_KEY;
  if (!v || /your_.*_here/i.test(v)) {
    res.status(503).json({ error: 'Speech recognition not configured', missing: 'SPEECH_API_KEY' });
    return false;
  }
  return v;
}

router.post('/pronunciation', auth, async (req, res) => {
  if (!speechKeyOr503(res)) return;
  const { audio_url, target_language = 'en', target_text } = req.body || {};
  if (!audio_url) return res.status(400).json({ error: 'audio_url required' });
  // Stub: when SPEECH_API_KEY is configured the implementer wires the SDK
  // for the chosen provider. We return a structured envelope rather than
  // making an unreviewed external call.
  res.json({
    audio_url, target_language, target_text: target_text || null,
    provider: process.env.SPEECH_PROVIDER || 'assemblyai',
    pronunciation_score: null,
    word_level: [],
    note: 'Pronunciation grading wiring pending provider selection — set SPEECH_API_KEY + SPEECH_PROVIDER and replace stub with SDK call.'
  });
});

router.post('/music-feedback', auth, async (req, res) => {
  if (!speechKeyOr503(res)) return;
  const { audio_url, target_piece, instrument } = req.body || {};
  if (!audio_url) return res.status(400).json({ error: 'audio_url required' });
  res.json({
    audio_url, target_piece: target_piece || null, instrument: instrument || null,
    provider: process.env.SPEECH_PROVIDER || 'assemblyai',
    rhythm_score: null,
    pitch_score: null,
    dynamics_score: null,
    note: 'Music feedback wiring pending provider selection — set SPEECH_API_KEY and replace stub.'
  });
});

module.exports = router;
