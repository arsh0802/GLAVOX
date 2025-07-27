
const express = require('express');
const router = express.Router();
const { speakWithPolly } = require('../controllers/speechController');
const auth = require('../middleware/auth');

// 🎯 Route: POST /speech/tts
// 📥 Input: { text }
// 📤 Output: { audioUrl }
router.post('/tts', auth, async (req, res) => {
  try {
    const text = req.body.text;
    console.log(text);
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const audioUrl = await speakWithPolly(text);

    if (!audioUrl) {
      return res.status(500).json({ error: 'Failed to generate audio' });
    }

    res.json({ 
        response: text, 
        aireply: audioUrl
    });
  } catch (error) {
    console.error('❌ TTS Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
