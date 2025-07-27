const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Chat } = require('groq-sdk/resources/index.mjs');

// Configure multer for audio file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const sessionId = req.body.sessionId;
    const uploadDir = path.join(__dirname, '../../uploads', sessionId);
    // Create session-specific uploads directory if it doesn't exist
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

// Apply auth middleware to all routes
router.use(authMiddleware);

// Start chat tracking
router.post('/start-chat', trackingController.startChatTracking);
console.log(res, req('/start-chat'));




// End chat tracking
router.post('/end-chat', trackingController.endChatTracking);

// Update speaking time with audio file
router.post('/update-speaking-time', 
  upload.single('audio'),
  trackingController.updateSpeakingTime
);

router.get('/session/:sessionId/speaking-time', trackingController.getSessionSpeakingTime);

module.exports = router; 