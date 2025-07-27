import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const API_URL = 'http://192.168.170.195.16.146.58:5000/api';

const TIMING_KEYS = {
  TRACKING_ID: '@timing_tracking_id',
  PAGE_ENTER_TIME: '@page_enter_time',
  SPEAKING_START_TIME: '@speaking_start_time',
  CHAT_START_TIME: '@chat_start_time',
  SESSION_ID: 'currentSessionId',
  SESSION_START_TIME: 'sessionStartTime'
};

const convertToMinutes = (milliseconds) => {
  return Number((milliseconds / (1000 * 60)).toFixed(2));
};

class UserTrackingService {
  static instance = null;

  constructor() {
    if (UserTrackingService.instance) {
      return UserTrackingService.instance;
    }
    UserTrackingService.instance = this;

    this.trackingId = null;
    this.sessionId = null;
    this.sessionStartTime = null;
    this.currentPageEnterTime = null;
    this.speakingStartTime = null;
    this.chatStartTime = null;
    this.isSpeaking = false;
    this.speechListener = null;
  }

  // ===== COMMON =====
  async getHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ===== INITIALIZATION =====
  async initialize() {
    try {
      this.trackingId = await AsyncStorage.getItem(TIMING_KEYS.TRACKING_ID);
      this.sessionId = await AsyncStorage.getItem(TIMING_KEYS.SESSION_ID);
      this.setupSpeechListener();
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      return false;
    }
  }

  // ===== SPEECH LISTENER =====
  setupSpeechListener() {
    if (this.speechListener) return;

    this.speechListener = Speech.addListener('onSpeechStart', () => {
      this.startSpeakingTracking();
    });

    this.speechListener = Speech.addListener('onSpeechEnd', () => {
      this.endSpeakingTracking();
    });
  }

  // ===== CHAT TRACKING =====
  async startChatTracking(userId, token) {
    try {
      const startTime = new Date();
      this.chatStartTime = startTime;
      await AsyncStorage.setItem(TIMING_KEYS.CHAT_START_TIME, startTime.toISOString());

      const response = await axios.post(`${API_URL}/tracking/start-chat`, {
        userId,
        startTime: startTime.toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      this.trackingId = response.data.trackingId;
      await AsyncStorage.setItem(TIMING_KEYS.TRACKING_ID, this.trackingId);

      return true;
    } catch (error) {
      console.error('Start chat tracking error:', error);
      return false;
    }
  }

  async endChatTracking(token) {
    try {
      if (!this.trackingId || !this.chatStartTime) return false;

      const endTime = new Date();
      const duration = convertToMinutes(endTime - this.chatStartTime);

      await axios.post(`${API_URL}/tracking/end-chat`, {
        trackingId: this.trackingId,
        endTime: endTime.toISOString(),
        duration
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      this.chatStartTime = null;
      await AsyncStorage.removeItem(TIMING_KEYS.CHAT_START_TIME);
      return true;
    } catch (error) {
      console.error('End chat tracking error:', error);
      return false;
    }
  }

  // ===== SPEAKING TIME TRACKING (DURATION) =====
  async startSpeakingTracking() {
    try {
      if (this.isSpeaking) return true;
      const startTime = new Date();
      this.speakingStartTime = startTime;
      this.isSpeaking = true;
      await AsyncStorage.setItem(TIMING_KEYS.SPEAKING_START_TIME, startTime.toISOString());

      console.log('Speaking started:', startTime.toISOString());
      return true;
    } catch (error) {
      console.error('Start speaking tracking error:', error);
      return false;
    }
  }

  async endSpeakingTracking(token) {
    try {
      if (!this.trackingId || !this.speakingStartTime || !this.isSpeaking) return false;

      const endTime = new Date();
      const duration = convertToMinutes(endTime - this.speakingStartTime);

      console.log('Speaking ended:', {
        startTime: this.speakingStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration
      });

      await axios.post(`${API_URL}/tracking/speaking-time`, {
        trackingId: this.trackingId,
        startTime: this.speakingStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      this.speakingStartTime = null;
      this.isSpeaking = false;
      await AsyncStorage.removeItem(TIMING_KEYS.SPEAKING_START_TIME);
      return true;
    } catch (error) {
      console.error('End speaking tracking error:', error);
      return false;
    }
  }

  // ===== SESSION ANALYTICS =====
  async checkActiveSession(userId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${API_URL}/analytics/users/${userId}/active-session`, { headers });
      
      if (response.data.activeSession) {
        this.sessionId = response.data.sessionId;
        this.sessionStartTime = new Date();
        await AsyncStorage.setItem(TIMING_KEYS.SESSION_ID, this.sessionId);
        await AsyncStorage.setItem(TIMING_KEYS.SESSION_START_TIME, this.sessionStartTime.toISOString());
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Check active session error:', error);
      return null;
    }
  }

  async startSession(userId) {
    try {
      const headers = await this.getHeaders();
      const startTime = new Date().toISOString();
      const response = await axios.post(`${API_URL}/analytics/sessions`, {
        userId,
        startTime
      }, { headers });

      if (!response.data || !response.data._id) {
        throw new Error('Invalid session response');
      }

      this.sessionId = response.data._id;
      this.sessionStartTime = new Date();
      await AsyncStorage.setItem(TIMING_KEYS.SESSION_ID, this.sessionId);
      await AsyncStorage.setItem(TIMING_KEYS.SESSION_START_TIME, this.sessionStartTime.toISOString());

      console.log('Session started successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Start session error:', error);
      throw error;
    }
  }

  async endSession() {
    if (!this.sessionId) {
      console.log('No active session to end');
      return;
    }

    try {
      const headers = await this.getHeaders();
      const start = new Date(await AsyncStorage.getItem(TIMING_KEYS.SESSION_START_TIME));
      const duration = Math.floor((new Date() - start) / 1000); // seconds

      const response = await axios.put(`${API_URL}/analytics/sessions/${this.sessionId}/end`, {
        endTime: new Date().toISOString(),
        duration
      }, { headers });

      console.log('Session ended successfully:', response.data);

      this.sessionId = null;
      this.sessionStartTime = null;
      await AsyncStorage.multiRemove([TIMING_KEYS.SESSION_ID, TIMING_KEYS.SESSION_START_TIME]);
      return response.data;
    } catch (error) {
      console.error('End session error:', error);
      throw error;
    }
  }

  async updateSpeakingAudio(audioBlob) {
    if (!this.sessionId) {
      console.error('No active session for speaking update');
      return;
    }

    try {
      const headers = await this.getHeaders();
      const formData = new FormData();
      formData.append('audio', {
        uri: audioBlob.uri,
        type: 'audio/m4a',
        name: 'audio.m4a'
      });

      const response = await axios.put(
        `${API_URL}/analytics/sessions/${this.sessionId}/speaking-time`,
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Speaking time updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update speaking audio error:', error);
      throw error;
    }
  }

  async getSessionAnalytics(userId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${API_URL}/analytics/users/${userId}/sessions`, { headers });
      return response.data;
    } catch (error) {
      console.error('Get session analytics error:', error);
      throw error;
    }
  }

  async getWeeklySessions(userId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${API_URL}/analytics/users/${userId}/weekly`, { headers });
      return response.data;
    } catch (error) {
      console.error('Get weekly sessions error:', error);
      throw error;
    }
  }

  // ===== CLEANUP =====
  async cleanup() {
    try {
      if (this.speechListener) {
        this.speechListener.remove();
        this.speechListener = null;
      }

      await AsyncStorage.multiRemove([
        TIMING_KEYS.TRACKING_ID,
        TIMING_KEYS.PAGE_ENTER_TIME,
        TIMING_KEYS.SPEAKING_START_TIME,
        TIMING_KEYS.CHAT_START_TIME,
        TIMING_KEYS.SESSION_ID,
        TIMING_KEYS.SESSION_START_TIME
      ]);

      this.trackingId = null;
      this.sessionId = null;
      this.speakingStartTime = null;
      this.chatStartTime = null;
      this.isSpeaking = false;
      this.sessionStartTime = null;
      return true;
    } catch (error) {
      console.error('Cleanup error:', error);
      return false;
    }
  }
}

export const userTrackingService = new UserTrackingService();
