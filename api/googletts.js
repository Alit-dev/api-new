const express = require('express');
const router = express.Router();
const googleTTS = require('google-tts-api');

// Route: /api/tts?text=hello&lang=bn
router.get('/', async (req, res) => {
  const text = req.query.text;
  const lang = req.query.lang || 'bn'; // default Bengali

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  try {
    const url = googleTTS.getAudioUrl(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    res.redirect(url); // 🔁 redirect to audio URL
  } catch (err) {
    res.status(500).json({ error: 'TTS failed', details: err.message });
  }
});

module.exports = router;
