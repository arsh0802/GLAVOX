// Scoring weights for different parameters
const SCORING_WEIGHTS = {
    pronunciation: 0.25,
    confidence: 0.2,
    clarity: 0.2,
    responseTime: 0.15,
    interactionFlow: 0.2
};

// Thresholds for different metrics
const THRESHOLDS = {
    wordAccuracy: { min: 0.6, max: 0.95 },
    phonemeAccuracy: { min: 0.7, max: 0.98 },
    volumeLevel: { min: 40, max: 85 },
    speakingRate: { min: 120, max: 160 }, // words per minute
    pauseFrequency: { min: 0.1, max: 0.3 }, // pauses per second
    noiseLevel: { min: -60, max: -30 }, // dB
    responseTime: { min: 0.5, max: 3 }, // seconds
    contextRelevance: { min: 0.7, max: 0.95 }
};

// Calculate pronunciation score based on word and phoneme accuracy
const calculatePronunciationScore = (metrics) => {
    const wordScore = normalizeValue(metrics.wordAccuracy, THRESHOLDS.wordAccuracy);
    const phonemeScore = normalizeValue(metrics.phonemeAccuracy, THRESHOLDS.phonemeAccuracy);
    return (wordScore * 0.6 + phonemeScore * 0.4) * 100;
};

// Calculate confidence score based on volume and speaking rate
const calculateConfidenceScore = (metrics) => {
    const volumeScore = normalizeValue(metrics.volumeLevel, THRESHOLDS.volumeLevel);
    const rateScore = normalizeValue(metrics.speakingRate, THRESHOLDS.speakingRate);
    return (volumeScore * 0.5 + rateScore * 0.5) * 100;
};

// Calculate clarity score based on pause frequency and noise level
const calculateClarityScore = (metrics) => {
    const pauseScore = normalizeValue(metrics.pauseFrequency, THRESHOLDS.pauseFrequency);
    const noiseScore = normalizeValue(Math.abs(metrics.noiseLevel), 
        { min: Math.abs(THRESHOLDS.noiseLevel.max), max: Math.abs(THRESHOLDS.noiseLevel.min) });
    return (pauseScore * 0.4 + noiseScore * 0.6) * 100;
};

// Calculate response time score
const calculateResponseTimeScore = (metrics) => {
    return normalizeValue(metrics.responseTime, THRESHOLDS.responseTime) * 100;
};

// Calculate interaction flow score based on context relevance
const calculateInteractionFlowScore = (metrics) => {
    return normalizeValue(metrics.contextRelevance, THRESHOLDS.contextRelevance) * 100;
};

// Normalize a value between 0 and 1 based on min/max thresholds
const normalizeValue = (value, { min, max }) => {
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
};

// Calculate combined score based on individual scores and weights
const calculateCombinedScore = (scores) => {
    return Object.entries(SCORING_WEIGHTS).reduce((total, [key, weight]) => {
        return total + (scores[key] * weight);
    }, 0);
};

// Generate feedback based on scores
const generateFeedback = (scores) => {
    const feedback = [];
    
    if (scores.pronunciation < 70) {
        feedback.push("Try to speak more clearly and focus on word pronunciation.");
    }
    if (scores.confidence < 70) {
        feedback.push("Speak with more confidence and maintain a steady volume.");
    }
    if (scores.clarity < 70) {
        feedback.push("Reduce background noise and pace your speech with appropriate pauses.");
    }
    if (scores.responseTime < 70) {
        feedback.push("Try to respond more promptly while maintaining natural conversation flow.");
    }
    if (scores.interactionFlow < 70) {
        feedback.push("Focus on maintaining relevant and contextual responses.");
    }

    return feedback;
};

// Calculate all scores from metrics
const calculateScores = (metrics) => {
    const scores = {
        pronunciation: calculatePronunciationScore(metrics),
        confidence: calculateConfidenceScore(metrics),
        clarity: calculateClarityScore(metrics),
        responseTime: calculateResponseTimeScore(metrics),
        interactionFlow: calculateInteractionFlowScore(metrics)
    };
    
    scores.combined = calculateCombinedScore(scores);
    return scores;
};

module.exports = {
    calculateScores,
    generateFeedback,
    SCORING_WEIGHTS,
    THRESHOLDS
}; 