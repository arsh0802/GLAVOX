const UserSession = require('../models/UserSession');

const { formatISTDateTime, formatDuration, calculateSpeakingStats, calculateTotalSpeakingTime } = require('../utils/timeUtils');
const { createSpeakingSegment } = require('../utils/audioUtils');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

// Configure multer for audio file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
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
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an audio file!'), false);
        }
    }
});

// Get the audio file duration in seconds
const getAudioDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.error('Audio file not found:', filePath);
            return reject('Audio file not found');
        }

        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error('Error fetching audio duration:', err);
                return reject('Error processing audio file');
            }
            if (!metadata || !metadata.format || !metadata.format.duration) {
                return reject('Invalid audio file metadata');
            }
            resolve(Math.ceil(metadata.format.duration));
        });
    });
};

// Create a new session for a user
exports.createSession = async (req, res) => {
    try {
        const { userId, startTime } = req.body;

        if (!userId) {
            console.error("❌ userId missing in request body");
            return res.status(400).json({ error: "userId is required" });
        }

        const enterTime = startTime ? new Date(startTime) : new Date();

        const activeSession = await UserSession.findOne({ 
            userId: new mongoose.Types.ObjectId(userId),
            chatPageExitTime: { $exists: false }
        });

        if (activeSession) {
            console.log("⚠ Returning active session instead of creating new one");
            return res.status(200).json(activeSession);
        }

        const session = new UserSession({
            userId: new mongoose.Types.ObjectId(userId),
            chatPageEnterTime: enterTime,
            chatPageEnterTimeIST: formatISTDateTime(enterTime),
            speakingCount: 0,
            totalSpeakingTimeInSeconds: 0,
            longestDurationInSeconds: 0,
            shortestDurationInSeconds: 0,
            averageDurationInSeconds: 0
        });

        const savedSession = await session.save();
        console.log('✅ New session created:', savedSession);
        res.status(201).json(savedSession);
    } catch (error) {
        console.error('❌ Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
};


// End chat tracking
exports.endChatTracking = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { endTime, duration } = req.body;
        const exitTime = new Date(endTime);

        const session = await UserSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Update session with exit time and duration
        session.chatPageExitTime = exitTime;
        session.chatPageExitTimeIST = formatISTDateTime(exitTime);
        session.totalChatDurationInSeconds = duration;
        session.formattedChatDuration = formatDuration(duration * 1000);

            await session.save();
        console.log('Session ended:', session);

        res.json({
            success: true,
            session: {
                id: session._id,
                enterTime: session.chatPageEnterTimeIST,
                exitTime: session.chatPageExitTimeIST,
                duration: session.formattedChatDuration,
                speakingTime: session.formattedSpeakingTime,
                speakingCount: session.speakingCount,
                totalSpeakingTime: session.totalSpeakingTimeInSeconds,
                longestDuration: session.longestDurationInSeconds,
                shortestDuration: session.shortestDurationInSeconds,
                averageDuration: session.averageDurationInSeconds
            }
        });
    } catch (error) {
        console.error('Error ending chat tracking:', error);
        res.status(500).json({ error: 'Failed to end chat tracking' });
    }
};

// Update speaking time
exports.updateSpeakingTime = async (req, res) => {
    try {
      const { sessionId } = req.params;
        const audioFile = req.file;

      console.log("📥 Received request for updateSpeakingTime");
      console.log("👉 sessionId:", sessionId);
      console.log("📂 req.file:", audioFile);
  
      if (!audioFile) {
        return res.status(400).json({ error: 'No audio file provided' });
      }
  
      const session = await UserSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      const durationInSeconds = await getAudioDuration(audioFile.path);
      console.log('🎧 Audio duration:', durationInSeconds);
  
      session.speakingCount += 1;
      session.totalSpeakingTimeInSeconds += durationInSeconds;
  
      if (durationInSeconds > session.longestDurationInSeconds) {
        session.longestDurationInSeconds = durationInSeconds;
      }
      if (
        session.shortestDurationInSeconds === 0 ||
        durationInSeconds < session.shortestDurationInSeconds
      ) {
        session.shortestDurationInSeconds = durationInSeconds;
      }
  
      session.averageDurationInSeconds = session.totalSpeakingTimeInSeconds / session.speakingCount;
      session.formattedSpeakingTime = formatDuration(session.totalSpeakingTimeInSeconds * 1000);
  
      await session.save();
  
      fs.unlink(audioFile.path, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
  
      res.json({
            success: true,
                speakingStats: {
          duration: durationInSeconds,
          totalSpeakingTime: session.totalSpeakingTimeInSeconds,
          speakingCount: session.speakingCount,
          averageDuration: session.averageDurationInSeconds,
          longestDuration: session.longestDurationInSeconds,
          shortestDuration: session.shortestDurationInSeconds,
          formattedSpeakingTime: session.formattedSpeakingTime
        }
      });
    } catch (error) {
      console.error('❌ Error updating speaking time:', error);
      res.status(500).json({ error: 'Failed to update speaking time' });
    }  };

    exports.uploadAudio = upload.single('audio'); // ✅ Yeh ho chahiye

  
// Get all sessions for a specific user
exports.getUserSessions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;

        const sessions = await UserSession.find({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ chatPageEnterTime: -1 })
            .limit(parseInt(limit) || 10);

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get session speaking time
exports.getSessionSpeakingTime = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const session = await UserSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            success: true,
            data: {
                sessionId,
                totalSpeakingTime: session.totalSpeakingTimeInSeconds,
                formattedDuration: formatDuration(session.totalSpeakingTimeInSeconds * 1000)
            }
        });
    } catch (error) {
        console.error('Error getting session speaking time:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating speaking time',
            error: error.message
        });
    }
};

// Get session analytics
exports.getSessionAnalytics = async (req, res) => {
    try {
        const { userId } = req.params;

        const analytics = await UserSession.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$userId",
                    totalSessions: { $sum: 1 },
                    totalSpeakingTime: { $sum: "$totalSpeakingTimeInSeconds" },
                    averageSpeakingTime: { $avg: "$totalSpeakingTimeInSeconds" },
                    totalSpeakingCount: { $sum: "$speakingCount" }
                }
            }
        ]);

        res.json(analytics[0] || {
            _id: userId,
            totalSessions: 0,
            totalSpeakingTime: 0,
            averageSpeakingTime: 0,
            totalSpeakingCount: 0
        });
    } catch (error) {
        console.error('Error getting session analytics:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get weekly sessions
exports.getWeeklySessions = async (req, res) => {
    try {
        const { userId } = req.params;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const sessions = await UserSession.aggregate([
            { 
                $match: { 
                    userId: mongoose.Types.ObjectId(userId),
                    chatPageEnterTime: { $gte: oneWeekAgo }
                } 
            },
            {
                $group: {
                    _id: "$userId",
                    totalSessions: { $sum: 1 },
                    totalSpeakingTime: { $sum: "$totalSpeakingTimeInSeconds" },
                    averageSpeakingTime: { $avg: "$totalSpeakingTimeInSeconds" },
                    totalSpeakingCount: { $sum: "$speakingCount" }
                }
            }
        ]);

        res.json(sessions[0] || {
            _id: userId,
            totalSessions: 0,
            totalSpeakingTime: 0,
            averageSpeakingTime: 0,
            totalSpeakingCount: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Check if the user is already in a session
// Check if the user is already in a session
exports.checkUserSession = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const activeSession = await UserSession.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            chatPageExitTime: { $exists: false }
        });

        if (activeSession) {
            return res.json({
                success: true,
                isActive: true,
                session: activeSession
            });
        } else {
            return res.json({
                success: true,
                isActive: false
            });
        }
    } catch (error) {
        console.error('Error checking user session:', error);
        res.status(500).json({ error: 'Failed to check user session' });
    }
};

exports.markChatPageExit = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { endTime } = req.body;

        if (!sessionId) return res.status(400).json({ error: 'Session ID missing' });

        const session = await UserSession.findById(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const exitTime = endTime ? new Date(endTime) : new Date();
        session.chatPageExitTime = exitTime;
        session.chatPageExitTimeIST = formatISTDateTime(exitTime);

        const durationSec = Math.floor((exitTime - session.chatPageEnterTime) / 1000);
        session.totalChatDurationInSeconds = durationSec;
        session.formattedChatDuration = formatDuration(durationSec * 1000);

        await session.save();

        res.status(200).json({
            success: true,
            message: 'Chat exit recorded',
            session
        });
    } catch (err) {
        console.error("❌ Error marking chat-page-exit:", err);
        res.status(500).json({ error: 'Failed to update exit time' });
    }
};

exports.getStudentClusters = async (req, res) => {
    try {
        const sessions = await UserSession.find().populate('userId', 'name');

        const clusters = {
            cluster1: [], // < 15 min
            cluster2: [], // 15–30 min
            cluster3: []  // > 30 min
        };

        for (const session of sessions) {
            const minutes = parseFloat(session.formattedChatDuration) || 0;

            if (!session.userId || !session.userId.name) continue;

            const studentData = {
                name: session.userId.name,
                duration: minutes,
                formattedDuration: `${minutes} min`,
                enterTime: session.chatPageEnterTimeIST || 'N/A',
                speakingCount: session.speakingCount || 0,
                formattedSpeakingTime: session.formattedSpeakingTime || '0:00'
            };

            if (minutes < 15) {
                clusters.cluster1.push(studentData);
            } else if (minutes >= 15 && minutes <= 30) {
                clusters.cluster2.push(studentData);
            } else {
                clusters.cluster3.push(studentData);
            }
        }

        for (const key in clusters) {
            clusters[key].sort((a, b) => b.duration - a.duration);
        }

        res.json(clusters);
    } catch (error) {
        console.error("Error getting student clusters:", error);
        res.status(500).json({ error: "Failed to get student clusters" });
    }
};


module.exports = {
    createSession: exports.createSession,
    endChatTracking: exports.endChatTracking,
    markChatPageExit: exports.markChatPageExit,
  
    updateSpeakingTime: exports.updateSpeakingTime,
    uploadAudio: exports.uploadAudio, // ✅ Yeh line zaroori hai
  
    getUserSessions: exports.getUserSessions,
    getSessionSpeakingTime: exports.getSessionSpeakingTime,
    getSessionAnalytics: exports.getSessionAnalytics,
    getWeeklySessions: exports.getWeeklySessions,
    checkUserSession: exports.checkUserSession,
    getStudentClusters: exports.getStudentClusters
};
