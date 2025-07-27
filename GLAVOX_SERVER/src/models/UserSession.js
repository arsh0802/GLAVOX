const mongoose = require('mongoose');
const { Schema } = mongoose;
const { formatISTDateTime } = require('../utils/timeUtils');

// ---------- Utils ----------
const convertToIST = date => date ? new Date(date.getTime() + (5.5 * 60 * 60 * 1000)) : null;

const formatDuration = ms => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const calculateAverage = (values = []) => {
  const valid = values.filter(n => typeof n === 'number' && !isNaN(n));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

// ---------- Score & Metrics Schemas ----------
const ScoreSchema = new Schema({
  pronunciation: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  clarity: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 },
  interactionFlow: { type: Number, default: 0 },
  combined: { type: Number, default: 0 },
}, { _id: false });

const MetricsSchema = new Schema({
  wordAccuracy: { type: Number, default: 0 },
  phonemeAccuracy: { type: Number, default: 0 },
  volumeLevel: { type: Number, default: 0 },
  speakingRate: { type: Number, default: 0 },
  pauseFrequency: { type: Number, default: 0 },
  noiseLevel: { type: Number, default: 0 },
  contextRelevance: { type: Number, default: 0 },
}, { _id: false });

const ScoringHistorySchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  scores: ScoreSchema,
  metrics: MetricsSchema,
}, { _id: true });

// ---------- Main UserSession Schema ----------
const userSessionSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  },
  chatPageEnterTime: { type: Date },
  chatPageExitTime: { type: Date },
  totalChatDurationInSeconds: { type: Number, default: 0 },
  formattedChatDuration: { type: String },
  speakingCount: { type: Number, default: 0 },
  totalSpeakingTimeInSeconds: { type: Number, default: 0 },
  formattedSpeakingTime: { type: String },
  longestDurationInSeconds: { type: Number, default: 0 },
  shortestDurationInSeconds: { type: Number, default: 0 },
  averageDurationInSeconds: { type: Number, default: 0 },
  scoringHistory: [ScoringHistorySchema],
  finalScores: ScoreSchema,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ---------- Virtuals ----------
userSessionSchema.virtual('chatPageEnterTimeIST').get(function () {
  return convertToIST(this.chatPageEnterTime)?.toLocaleString('en-IN') || 'N/A';
});

userSessionSchema.virtual('chatPageExitTimeIST').get(function () {
  return convertToIST(this.chatPageExitTime)?.toLocaleString('en-IN') || 'N/A';
});

userSessionSchema.virtual('chatPageDuration').get(function () {
  if (!this.chatPageExitTime || !this.chatPageEnterTime) return '00:00';
  const durationMs = this.chatPageExitTime - this.chatPageEnterTime;
  return formatDuration(durationMs);
});

userSessionSchema.virtual('totalScreenTime').get(function () {
  const endTime = this.chatPageExitTime || new Date();
  return Math.floor((endTime - this.chatPageEnterTime) / 1000);
});

userSessionSchema.virtual('speakingTimeFormatted').get(function () {
  return formatDuration(this.totalSpeakingTimeInSeconds * 1000);
});

userSessionSchema.virtual('speakingPercentage').get(function () {
  const total = this.totalScreenTime;
  return total > 0 ? Math.round((this.totalSpeakingTimeInSeconds / total) * 100) : 0;
});

// ---------- Middleware ----------
userSessionSchema.pre('save', function (next) {
  if (this.chatPageExitTime && this.chatPageEnterTime) {
    this.totalChatDurationInSeconds = Math.floor((this.chatPageExitTime - this.chatPageEnterTime) / 1000);
    this.formattedChatDuration = formatDuration(this.totalChatDurationInSeconds * 1000);
  }

  this.averageDurationInSeconds = this.speakingCount > 0
    ? this.totalSpeakingTimeInSeconds / this.speakingCount
    : 0;

  next();
});

// ---------- Instance Methods ----------
userSessionSchema.methods.updateChatPageExit = async function () {
  this.chatPageExitTime = new Date();
  return this.save();
};

userSessionSchema.methods.updateSpeakingTime = async function (durationInSeconds) {
  this.totalSpeakingTimeInSeconds += durationInSeconds;
  this.speakingCount += 1;
  this.longestDurationInSeconds = Math.max(this.longestDurationInSeconds, durationInSeconds);
  this.shortestDurationInSeconds = this.shortestDurationInSeconds === 0
    ? durationInSeconds
    : Math.min(this.shortestDurationInSeconds, durationInSeconds);
  this.formattedSpeakingTime = formatDuration(this.totalSpeakingTimeInSeconds * 1000);
  return this.save();
};

userSessionSchema.methods.updateScores = async function (newScores) {
  this.scoringHistory.push({
    timestamp: new Date(),
    scores: newScores.scores,
    metrics: newScores.metrics,
  });

  const scoresList = this.scoringHistory.map(h => h.scores);

  this.finalScores = {
    pronunciation: calculateAverage(scoresList.map(s => s.pronunciation)),
    confidence: calculateAverage(scoresList.map(s => s.confidence)),
    clarity: calculateAverage(scoresList.map(s => s.clarity)),
    responseTime: calculateAverage(scoresList.map(s => s.responseTime)),
    interactionFlow: calculateAverage(scoresList.map(s => s.interactionFlow)),
    combined: calculateAverage(scoresList.map(s => s.combined)),
  };

  return this.save();
};

// ---------- Static Methods ----------
userSessionSchema.statics.getUserSessions = async function (userId, limit = 10) {
  const sessions = await this.find({ userId })
    .sort({ chatPageEnterTime: -1 })
    .limit(Number(limit))
    .lean();

  return sessions.map(session => ({
    ...session,
    chatPageEnterTime: convertToIST(session.chatPageEnterTime),
    chatPageExitTime: convertToIST(session.chatPageExitTime),
    createdAt: convertToIST(session.createdAt),
    chatPageDuration: formatDuration(
      session.chatPageExitTime && session.chatPageEnterTime
        ? session.chatPageExitTime - session.chatPageEnterTime
        : 0
    ),
    totalScreenTime: Math.floor(
      ((session.chatPageExitTime || new Date()) - session.chatPageEnterTime) / 1000
    ),
    speakingTimeFormatted: formatDuration(session.totalSpeakingTimeInSeconds * 1000),
    speakingPercentage: session.chatPageExitTime && session.chatPageEnterTime
      ? Math.round((session.totalSpeakingTimeInSeconds / ((session.chatPageExitTime - session.chatPageEnterTime) / 1000)) * 100)
      : 0,
  }));
};

module.exports = mongoose.model('UserSession', userSessionSchema);