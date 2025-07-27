const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// Create new session
router.post('/sessions', auth, analyticsController.createSession);

// End chat tracking (session)
router.put('/sessions/:sessionId/end', auth, analyticsController.endChatTracking);
router.put('/sessions/:sessionId/chat-page-exit', auth, analyticsController.markChatPageExit);



// Update speaking time with file upload
router.put('/sessions/:sessionId/speaking-time', 
    auth, 
    analyticsController.uploadAudio,
    analyticsController.updateSpeakingTime
);

// Get session speaking time
router.get('/sessions/:sessionId/speaking-time', auth, analyticsController.getSessionSpeakingTime);

// Get session analytics for a specific user
router.get('/users/:userId/analytics', auth, analyticsController.getSessionAnalytics);

// Get all user sessions
router.get('/users/:userId/sessions', auth, analyticsController.getUserSessions);

// Get weekly sessions data
router.get('/users/:userId/weekly-sessions', auth, analyticsController.getWeeklySessions);

// Check if user has an active session
router.get('/users/:userId/active-session', auth, analyticsController.checkUserSession);

// Get student clusters based on speaking duration
router.get('/student-clusters',  analyticsController.getStudentClusters);

module.exports = router;
