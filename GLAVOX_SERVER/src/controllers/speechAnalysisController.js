const UserSession = require('../models/UserSession');
const { calculateScores, generateFeedback } = require('../utils/scoringUtils');
const fs = require('fs');
const path = require('path');

const analyzeSpeechAndScore = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { transcribedText } = req.body;
    const previousMetrics = req.body.previousMetrics || {};

    if (!transcribedText) {
      return res.status(400).json({
        success: false,
        error: 'Transcribed text is required'
      });
    }

    // Get speech metrics from text analysis
    const speechMetrics = await analyzeTranscribedText(transcribedText);

    // Calculate scores using the scoring utilities
    const scores = calculateScores(speechMetrics);

    // Get session and update scores
    const session = await UserSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Update session scores
    const finalScores = await session.updateScores({
      scores: scores,
      metrics: speechMetrics
    });

    // Generate feedback based on scores
    const feedback = generateFeedback(scores);

    // Return scores and feedback
    res.json({
      success: true,
      scores: scores,
      finalScores,
      feedback,
      metrics: speechMetrics
    });

  } catch (error) {
    console.error('Speech analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze speech and calculate scores'
    });
  }
};

// Helper function to analyze transcribed text
const analyzeTranscribedText = async (text) => {
  // Initialize metrics object
  const metrics = {
    wordAccuracy: 0,
    phonemeAccuracy: 0,
    volumeLevel: 65, // Default value since we can't measure volume from text
    speakingRate: 0,
    pauseFrequency: 0,
    noiseLevel: -45, // Default value since we can't measure noise from text
    responseTime: 1.5, // Default value since we can't measure response time from text
    contextRelevance: 0
  };

  try {
    // Split text into words and sentences
    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate word accuracy based on word length and complexity (0-100)
    const wordLengths = words.map(w => w.length);
    const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / words.length;
    metrics.wordAccuracy = Math.min(Math.max((avgWordLength / 10) * 100, 0), 100);

    // Calculate phoneme accuracy based on word complexity (0-100)
    const complexWords = words.filter(w => w.length > 6).length;
    const complexityRatio = complexWords / words.length;
    metrics.phonemeAccuracy = Math.min(Math.max(complexityRatio * 100, 0), 100);

    // Calculate speaking rate (0-100)
    const estimatedDuration = sentences.length * 2; // Assume 2 seconds per sentence
    const wordsPerMinute = (words.length / estimatedDuration) * 60;
    metrics.speakingRate = Math.min(Math.max((wordsPerMinute / 200) * 100, 0), 100);

    // Calculate pause frequency (0-100)
    const pauseCount = sentences.length - 1;
    const pauseFrequency = pauseCount / (estimatedDuration / 60); // pauses per minute
    metrics.pauseFrequency = Math.min(Math.max((pauseFrequency / 2) * 100, 0), 100);

    // Calculate context relevance based on vocabulary diversity (0-100)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyRatio = uniqueWords.size / words.length;
    metrics.contextRelevance = Math.min(Math.max(vocabularyRatio * 100, 0), 100);

    // Scale volume level to 0-100 (assuming -60dB to 0dB range)
    metrics.volumeLevel = Math.min(Math.max(((metrics.volumeLevel + 60) / 60) * 100, 0), 100);

    // Scale noise level to 0-100 (assuming -60dB to 0dB range)
    metrics.noiseLevel = Math.min(Math.max(((metrics.noiseLevel + 60) / 60) * 100, 0), 100);

    // Scale response time to 0-100 (assuming 0-5 seconds range)
    metrics.responseTime = Math.min(Math.max((metrics.responseTime / 5) * 100, 0), 100);

    return metrics;
  } catch (error) {
    console.error('Error analyzing transcribed text:', error);
    return metrics; // Return default metrics if analysis fails
  }
};

module.exports = {
  analyzeSpeechAndScore,
  analyzeTranscribedText
}; 