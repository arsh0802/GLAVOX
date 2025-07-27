const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { speakWithPolly } = require('../controllers/speechController'); // ⬅️ Now properly separated
const { transcribeAudio } = require('../controllers/transcriptionController');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for audio file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an audio file!'), false);
    }
  }
});

// 🎯 Route: POST /ai/chat
// 📥 Input: { message, userId, conversationHistory }
// 📤 Output: { message, audioUrl }
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, userId, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // 🧠 Get AI Response with conversation history
    const aiReply = await chatWithAI(message, conversationHistory);

    // 🔊 Convert AI response to audio using Polly
    const audioUrl = await speakWithPolly(aiReply);

    // ✅ Send both AI text + TTS audio URL
    res.json({ 
      message: aiReply, 
      audioUrl 
    });
  } catch (err) {
    console.error('❌ AI Chat Route Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 🎯 Route: POST /ai/transcribe
// 📥 Input: audio file
// 📤 Output: { text: transcribedText }
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    console.log('🎯 Received transcription request');
    
    if (!req.file) {
      console.log('❌ No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📁 Audio file saved at:', req.file.path);
    console.log('📊 File size:', req.file.size + ' bytes');
    console.log('📊 File size (KB):', (req.file.size / 1024).toFixed(2) + ' KB');
    console.log('📊 File size (MB):', (req.file.size / (1024 * 1024)).toFixed(2) + ' MB');

    // Transcribe the audio file
    const transcribedText = await transcribeAudio(req.file.path);

    // Don't delete the file immediately, keep it for reference
    console.log('✅ Audio file preserved in uploads folder:', req.file.filename);

    console.log('✅ Sending transcription response');
    res.json({ 
      text: transcribedText,
      audioFile: req.file.filename // Send back the filename for reference
    });
  } catch (err) {
    console.error('❌ Transcription Error:', err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// 🎯 Route: POST /ai/end-conversation
// 📥 Input: { userId }
// 📤 Output: { success: true }
router.post('/end-conversation', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Here you can add any cleanup logic for the session
    // For example, clearing any temporary files or caches
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ End Conversation Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
