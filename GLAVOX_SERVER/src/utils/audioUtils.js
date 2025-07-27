const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Get the duration of an audio file in seconds using FFmpeg
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<number>} Duration in seconds
 */
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error('Audio file not found'));
      return;
    }

    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      const duration = parseFloat(stdout);
      if (isNaN(duration)) {
        reject(new Error('Could not determine audio duration'));
        return;
      }
      
      resolve(duration);
    });
  });
};

/**
 * Calculate total speaking time from all audio files in a session
 * @param {string} sessionId - ID of the session
 * @returns {Promise<number>} Total speaking time in seconds
 */
const calculateTotalSpeakingTime = async (sessionId) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const sessionDir = path.join(uploadsDir, sessionId);
  
  if (!fs.existsSync(sessionDir)) {
    return 0;
  }

  const files = fs.readdirSync(sessionDir);
  let totalDuration = 0;

  for (const file of files) {
    if (file.endsWith('.wav') || file.endsWith('.mp3')) {
      try {
        const duration = await getAudioDuration(path.join(sessionDir, file));
        totalDuration += duration;
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  }

  return totalDuration;
};

module.exports = {
  getAudioDuration,
  calculateTotalSpeakingTime
}; 