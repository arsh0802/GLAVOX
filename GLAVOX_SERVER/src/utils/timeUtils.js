const moment = require('moment-timezone');

/**
 * Convert milliseconds to minutes
 * @param {number} milliseconds
 * @returns {number} Duration in minutes (rounded to 2 decimal places)
 */
const convertToMinutes = (milliseconds) => {
  if (!milliseconds) return 0;
  return Number((milliseconds / (1000 * 60)).toFixed(2));
};

/**
 * Calculate duration between two dates in seconds
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {number} Duration in seconds
 */
const calculateDurationInSeconds = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const durationMs = new Date(endTime) - new Date(startTime);
  return Math.floor(durationMs / 1000);
};

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} milliseconds
 * @returns {string} e.g., "05:30"
 */
const formatDuration = (milliseconds) => {
  if (!milliseconds) return '00:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format a date to IST format
 * @param {Date|string|number} date
 * @returns {string} e.g., "YYYY-MM-DD HH:mm:ss"
 */
const formatISTDateTime = (date) => {
  if (!date) return 'N/A';
  return moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Calculate speaking statistics from sessions
 * @param {Array} sessions
 * @returns {Object} Statistics object
 */
const calculateSpeakingStats = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      totalSpeakingTime: 0,
      averageDuration: 0,
      longestDuration: 0,
      shortestDuration: 0,
      speakingCount: 0
    };
  }

  const stats = sessions.reduce((acc, session) => {
    acc.totalSpeakingTime += session.totalSpeakingTimeInSeconds || 0;
    acc.speakingCount += session.speakingCount || 0;
    acc.longestDuration = Math.max(acc.longestDuration, session.longestDurationInSeconds || 0);
    acc.shortestDuration = Math.min(acc.shortestDuration, session.shortestDurationInSeconds || 0);
    return acc;
  }, {
    totalSpeakingTime: 0,
    speakingCount: 0,
    longestDuration: 0,
    shortestDuration: Infinity
  });

  return {
    totalSpeakingTime: stats.totalSpeakingTime,
    averageDuration: stats.speakingCount > 0 ? stats.totalSpeakingTime / stats.speakingCount : 0,
    longestDuration: stats.longestDuration,
    shortestDuration: stats.shortestDuration === Infinity ? 0 : stats.shortestDuration,
    speakingCount: stats.speakingCount
  };
};

module.exports = {
  convertToMinutes,
  calculateDurationInSeconds,
  formatDuration,
  formatISTDateTime,
  formatToIST: formatISTDateTime, // alias
  calculateSpeakingStats
};
