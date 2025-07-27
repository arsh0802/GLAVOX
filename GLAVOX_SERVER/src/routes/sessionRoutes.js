const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Save session data
router.post('/save', sessionController.saveSession);

// Get weekly sessions for a user
router.get('/weekly/:userId', sessionController.getWeeklySessions);

// Check active session
router.get('/check/:userId', sessionController.checkUserSession);

// Get session analytics
router.get('/analytics/:userId', sessionController.getSessionAnalytics);

module.exports = router; 