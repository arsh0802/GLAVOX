const express = require('express');
const router = express.Router();
const multer = require('multer');
const speechAnalysisController = require('../controllers/speechAnalysisController');
const auth = require('../middleware/auth');

// Configure multer for audio file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Route for analyzing speech and calculating scores
router.post(
  '/sessions/:sessionId/analyze',
  auth,
  upload.single('audio'),
  speechAnalysisController.analyzeSpeechAndScore
);

module.exports = router; 