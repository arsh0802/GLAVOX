import React, { useState, useEffect, useRef } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Alert, Animated, Easing, Dimensions, BackHandler, ImageBackground, ScrollView
} from 'react-native';
import { useRouter } from "expo-router";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { jwtDecode } from 'jwt-decode';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import AnalyticsDisplay from '../components/AnalyticsDisplay';
import { userTrackingService } from '../services/UserTrackingService';

// Create a timing service instance
// This was missing in your code and causing errors
const timingService = {
  initialize: async function() {
    // Initialize timing service
    console.log('Timing service initialized');
    return true;
  },
  startChatTracking: async function(userId, token) {
    // Start chat tracking
    console.log('Chat tracking started for user:', userId);
    return true;
  },
  endChatTracking: async function(token) {
    // End chat tracking
    console.log('Chat tracking ended');
    return true;
  },
  startSpeakingTracking: async function() {
    // Start speaking tracking
    console.log('Speaking tracking started');
    return true;
  },
  endSpeakingTracking: async function(token) {
    // End speaking tracking
    console.log('Speaking tracking ended');
    return true;
  },
  cleanup: async function() {
    // Cleanup timing service
    console.log('Timing service cleaned up');
    return true;
  }
};

const API_URL = 'http://192.168.170.195:5000/api';
const FLASK_API_URL = 'http://192.168.170.195:5001/';

// Add conversation history constants
const CONVERSATION_HISTORY_KEY = 'conversation_history';
const SESSION_START_TIME_KEY = 'session_start_time';
const SESSION_TIMEOUT = 30 * 60 * 1000;

const { width } = Dimensions.get('window');

// Update animation constants
const PULSE_DURATION = 1500;
const MIN_SCALE = 1;
const MAX_SCALE = 1.4;
const VOICE_SENSITIVITY = 30;

// Add token validation function
const validateToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return false;
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (refreshResponse.data.token) {
        await AsyncStorage.setItem('token', refreshResponse.data.token);
        return refreshResponse.data.token;
      }
      return false;
    }
    return token;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

//components
export default function AiScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [terminalText, setTerminalText] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const voiceScale = useRef(new Animated.Value(1)).current;
  const meeterInterval = useRef(null);
  const prevMeteringValue = useRef(-160);
  const recordingRef = useRef(null);
  const silenceStartTimeRef = useRef(null);

  useEffect(() => {
    loadConversationHistory();
    startNewSession();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      endSession();
      router.replace("/home_screen");
      return true;
    });

    return () => {
      backHandler.remove();
      endSession();
    };
  }, []);

  //start new session
  const startNewSession = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const decoded = jwtDecode(token);
      const res = await axios.post(`${API_URL}/analytics/sessions`, {
        userId: decoded.userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await AsyncStorage.setItem('sessionId', res.data._id);
      const currentTime = new Date().getTime();
      await AsyncStorage.setItem(SESSION_START_TIME_KEY, currentTime.toString());
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  //end session
  const endSession = async () => {
    try {
      const sessionId = await AsyncStorage.getItem('sessionId');
      if (sessionId) {
        const token = await AsyncStorage.getItem('token');
        
        // Get final scores and session summary
        try {
          const decoded = jwtDecode(token);
          const scoresResponse = await axios.get(
            `${API_URL}/analytics/users/${decoded.userId}/sessions?limit=1`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          const sessionData = scoresResponse.data[0]; // Get the most recent session
          const finalScores = sessionData.finalScores;
          const scoringHistory = sessionData.scoringHistory;
          
          // Calculate improvement trends
          const improvements = calculateImprovements(scoringHistory);
          
          // End the session
          await axios.put(
            `${API_URL}/analytics/sessions/${sessionId}/chat-page-exit`,
            { finalScores },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          // Show comprehensive session summary
          if (finalScores) {
            const sessionDuration = sessionData.chatPageDuration || '0:00';
            const speakingTime = sessionData.speakingTimeFormatted || '0m 0s';
            const speakingPercentage = sessionData.speakingPercentage || 0;

            let feedbackMessage = `Session Summary:\n\n`;
            feedbackMessage += `Duration: ${sessionDuration}\n`;
            feedbackMessage += `Speaking Time: ${speakingTime} (${speakingPercentage}% of session)\n\n`;
            feedbackMessage += `Final Scores:\n`;
            feedbackMessage += `Pronunciation: ${(finalScores.pronunciation || 0).toFixed(1)}/100\n`;
            feedbackMessage += `Confidence: ${(finalScores.confidence || 0).toFixed(1)}/100\n`;
            feedbackMessage += `Clarity: ${(finalScores.clarity || 0).toFixed(1)}/100\n`;
            feedbackMessage += `Response Time: ${(finalScores.responseTime || 0).toFixed(1)}/100\n`;
            feedbackMessage += `Interaction Flow: ${(finalScores.interactionFlow || 0).toFixed(1)}/100\n`;
            feedbackMessage += `Overall Score: ${(finalScores.combined || 0).toFixed(1)}/100\n\n`;

            // Add improvement trends if available
            if (improvements.length > 0) {
              feedbackMessage += `Key Improvements:\n${improvements.join('\n')}\n\n`;
            }

            // Add areas for improvement
            const areasToImprove = getAreasForImprovement(finalScores);
            if (areasToImprove.length > 0) {
              feedbackMessage += `Areas to Focus On:\n${areasToImprove.join('\n')}`;
            }

            Alert.alert(
              'Session Complete',
              feedbackMessage,
              [{ text: 'OK', style: 'default' }]
            );
          }
        } catch (error) {
          console.error('Error getting final scores:', error);
        }
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }

    await clearConversationHistory();
    await endConversation();
  };

  // Helper function to calculate improvements
  const calculateImprovements = (history) => {
    if (!history || history.length < 2) return [];
    
    const improvements = [];
    const firstScores = history[0].scores;
    const lastScores = history[history.length - 1].scores;
    
    const categories = ['pronunciation', 'confidence', 'clarity', 'responseTime', 'interactionFlow'];
    
    categories.forEach(category => {
      const improvement = lastScores[category] - firstScores[category];
      if (improvement >= 10) {
        improvements.push(`${category.charAt(0).toUpperCase() + category.slice(1)}: +${improvement.toFixed(1)} points`);
      }
    });
    
    return improvements;
  };

  // Helper function to get areas that need improvement
  const getAreasForImprovement = (scores) => {
    const areas = [];
    const threshold = 70; // Score threshold for suggesting improvement
    
    if (scores.pronunciation < threshold) {
      areas.push('• Practice clear pronunciation and word stress');
    }
    if (scores.confidence < threshold) {
      areas.push('• Work on speaking volume and pace consistency');
    }
    if (scores.clarity < threshold) {
      areas.push('• Focus on reducing background noise and speech clarity');
    }
    if (scores.responseTime < threshold) {
      areas.push('• Improve response time while maintaining quality');
    }
    if (scores.interactionFlow < threshold) {
      areas.push('• Enhance natural conversation flow and relevance');
    }
    
    return areas;
  };

  //check session validity
  const isSessionValid = async () => {
    try {
      const sessionStartTime = await AsyncStorage.getItem(SESSION_START_TIME_KEY);
      if (!sessionStartTime) return false;
      const currentTime = new Date().getTime();
      const sessionAge = currentTime - parseInt(sessionStartTime);
      return sessionAge < SESSION_TIMEOUT;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  //load conversation history
  const loadConversationHistory = async () => {
    try {
      const isValid = await isSessionValid();
      if (!isValid) {
        await clearConversationHistory();
        return;
      }
      const history = await AsyncStorage.getItem(CONVERSATION_HISTORY_KEY);
      if (history) {
        setConversationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  //save conversation history
  const saveConversationHistory = async (newMessage) => {
    try {
      const updatedHistory = [...conversationHistory, newMessage];
      setConversationHistory(updatedHistory);
      await AsyncStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  };

  //clear conversation history
  const clearConversationHistory = async () => {
    try {
      await AsyncStorage.removeItem(CONVERSATION_HISTORY_KEY);
      await AsyncStorage.removeItem(SESSION_START_TIME_KEY);
      await AsyncStorage.removeItem('sessionId');
      setConversationHistory([]);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  };

  // Update animation effect
  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: PULSE_DURATION,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: PULSE_DURATION,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: PULSE_DURATION,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: PULSE_DURATION,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.5);
    }
  }, [isSpeaking]);

  // Clean up sound and recording when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [sound, recording]);

  // Initialize timing service and start tracking
  useEffect(() => {
    const initializeTiming = async () => {
      try {
        const token = await validateToken();
        if (!token) return;

        const decoded = jwtDecode(token);
        
        // Initialize timing service
        await timingService.initialize();
        
        // Start chat tracking
        await timingService.startChatTracking(decoded.userId, token);
      } catch (error) {
        console.error('Timing initialization error:', error);
        // Don't block the app if timing fails
      }
    };

    initializeTiming();

    // Cleanup timing on unmount
    return () => {
      const cleanup = async () => {
        try {
          const token = await validateToken();
          if (token) {
            await timingService.endChatTracking(token);
            await timingService.cleanup();
          }
        } catch (error) {
          console.error('Timing cleanup error:', error);
        }
      };
      cleanup();
    };
  }, []);

  // Improved voice meter function
  const startVoiceMeter = async () => {
    if (recording) {
      setIsAnimating(true);
      meeterInterval.current = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording) {
            const metering = Math.max(status.metering || -160, -160); // Clamp minimum value
            const delta = Math.abs(metering - prevMeteringValue.current);
            
            // Only update animation if there's significant change in voice level
            if (delta > 1) {
              prevMeteringValue.current = metering;
              
              // Enhanced voice level to scale mapping
              const normalizedValue = Math.pow((metering + 160) / 160, VOICE_SENSITIVITY);
              const newScale = MIN_SCALE + (normalizedValue * (MAX_SCALE - MIN_SCALE));

              // Smooth animation based on voice intensity
              Animated.timing(voiceScale, {
                toValue: newScale,
                duration: 50, // Faster response time
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();
            }
          }
        } catch (error) {
          console.error('Error getting audio metering:', error);
        }
      }, 50); // More frequent updates for smoother animation
    }
  };

  // Add the stopVoiceMeter function that was missing
  const stopVoiceMeter = () => {
    setIsAnimating(false);
    if (meeterInterval.current) {
      clearInterval(meeterInterval.current);
      meeterInterval.current = null;
    }
    // Smooth transition to static state
    Animated.timing(voiceScale, {
      toValue: MIN_SCALE,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    prevMeteringValue.current = -160;
  };

  // Modify startRecording
  const startRecording = async () => {
    try {
      if (recording) {
        await stopRecording();
        return;
      }

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Reset silence detection
      silenceStartTimeRef.current = null;

      // Create new recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            meteringEnabled: true,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            meteringEnabled: true,
          },
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const metering = Math.max(status.metering, -160);
            
            // Check for silence
            if (metering < -50) {
              if (!silenceStartTimeRef.current) {
                silenceStartTimeRef.current = Date.now();
              } else {
                const silenceDuration = Date.now() - silenceStartTimeRef.current;
                
                if (silenceDuration > 2000) {
                  // Use the recording reference directly
                  if (recordingRef.current) {
                    stopRecording();
                  }
                }
              }
            } else {
              silenceStartTimeRef.current = null;
            }
          }
        },
        50
      );

      // Store reference to the recording
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
      setIsSpeaking(true);
      await timingService.startSpeakingTracking();
      startVoiceMeter();
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
      setIsSpeaking(false);
      setIsAnimating(false);
    }
  };

  const stopRecording = async () => {
    console.log("Stop recording called");
  
    try {
      setIsRecording(false);
      setIsSpeaking(false);
      setShowWaveform(false);
      
      // Stop the voice meter
      stopVoiceMeter();
  
      // Use either the current recording or the reference
      let activeRecording = recording;
      if (!activeRecording && recordingRef.current) {
        console.log("Fallback to recordingRef.current");
        activeRecording = recordingRef.current;
      }
  
      if (!activeRecording) {
        console.log("Missing Audio");
        return;
      }
  
      // End speaking tracking
      const token1 = await validateToken();
      if (token1) {
        await timingService.endSpeakingTracking(token1);
      }
  
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      
      // Clear both references to the recording
      setRecording(null);
      recordingRef.current = null;
  
      if (!uri) {
        console.log('No recording URI found');
        return;
      }
  
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login first');
        router.push('/login_page');
        return;
      }
  
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      });
  
      // Get session ID
      const sessionId = await AsyncStorage.getItem('sessionId');
      if (!sessionId) {
        console.error('No session ID found');
        return;
      }
  
      // Get transcription
      try {
        const transcriptionResponse = await axios.post(
          `${FLASK_API_URL}api/ai/transcribe`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          }
        );

        if (!transcriptionResponse.data || !transcriptionResponse.data.text) {
          throw new Error('No transcription text received');
        }

        // Send audio for speech analysis and scoring
        try {
          const analysisResponse = await axios.post(
            `${API_URL}/speech/sessions/${sessionId}/analyze`,
            { transcribedText: transcriptionResponse.data.text },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          // Store the metrics for next analysis
          if (analysisResponse.data.scores) {
            await AsyncStorage.setItem('previousMetrics', JSON.stringify(analysisResponse.data.metrics));
          }
        } catch (error) {
          console.error('Error analyzing speech:', error.message);
        }

        const decoded = jwtDecode(token);
        await handleMicPress(decoded.userId, transcriptionResponse.data.text);
      } catch (error) {
        console.error('Error getting transcription:', error.message);
        Alert.alert('Transcription Error', error.message || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setIsRecording(false);
      setRecording(null);
      recordingRef.current = null;
    }
  };

  const endConversation = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const decoded = jwtDecode(token);
      await axios.post(`${API_URL}/ai/end-conversation`, {
        userId: decoded.userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('End conversation error:', error);
    }
  };

  const playAudio = async (audioUrl) => {
    try {
      if (sound) await sound.unloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const timestamp = new Date().getTime();
      const urlWithTimestamp = `http://192.168.170.195:5000${audioUrl}`;
      console.log(urlWithTimestamp);

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: urlWithTimestamp },
        { shouldPlay: true }
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleMicPress = async (userId, transcribedText) => {
    try {
      setIsLoading(true);
      const isValid = await isSessionValid();
      if (!isValid) {
        await clearConversationHistory();
        startNewSession();
      }

      const token = await validateToken();
      if (!token) {
        Alert.alert('Error', 'Please login again');
        router.push('/login_page');
        return;
      }

      const userMessage = {
        role: 'user',
        content: transcribedText,
        timestamp: new Date().toISOString()
      };
      await saveConversationHistory(userMessage);

      const response = await axios.post(
        `${API_URL}/ai/chat`,
        {
          userId,
          message: transcribedText,
          conversationHistory: conversationHistory
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString()
      };
      await saveConversationHistory(aiMessage);

      // Update terminal text
      setTerminalText(response.data.message);

      // Play audio response
      if (response.data.audioUrl) {
        await playAudio(response.data.audioUrl);
      }
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to process your message');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Separate useEffect for predefined messages
  useEffect(() => {
    const handlePredefinedMessage = async () => {
      try {
        const message = await AsyncStorage.getItem('predefinedMessage');
        if (!message) return;

        const token = await validateToken();
        if (!token) {
          console.error('No valid token found');
          return;
        }
        
        const decoded = jwtDecode(token);
        await handleMicPress(decoded.userId, message);
        await AsyncStorage.removeItem('predefinedMessage');
      } catch (error) {
        console.error('Error handling predefined message:', error);
        Alert.alert('Error', 'Failed to process your message');
      }
    };
    
    handlePredefinedMessage();
  }, []);

  // Separate useEffect for letsTalkAIResponse
  useEffect(() => {
    const handleLetsTalkResponse = async () => {
      try {
        const data = await AsyncStorage.getItem('letsTalkAIResponse');
        if (!data) return;

        const aiData = JSON.parse(data);
        setTerminalText(aiData.message);
        
        if (aiData.audioUrl) {
          await playAudio(aiData.audioUrl);
        }
        
        await AsyncStorage.removeItem('letsTalkAIResponse');
      } catch (error) {
        console.error('Error handling letsTalk response:', error);
        Alert.alert('Error', 'Failed to process AI response');
      }
    };

    // Add a small delay to ensure predefined message is processed first
    const timer = setTimeout(handleLetsTalkResponse, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* App Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F0F9F0']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.replace('./home_screen')}>
          <Image 
            source={require('../assets/images/back-button.png')} 
            style={styles.icon} 
          />
        </TouchableOpacity>
        <Image 
          source={require('../assets/images/LOGO.png')} 
          style={styles.logo} 
        />
        <TouchableOpacity onPress={() => router.navigate('./profile_screen')}>
          <Image 
            source={require('../assets/images/profile-icon.png')} 
            style={styles.icon} 
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* AI Visualization - Moved down with more space */}
        <View style={styles.aiVisualization}>
          <Animated.View style={[
            styles.voiceCircle,
            { transform: [{ scale: voiceScale }] }
          ]}>
            <LinearGradient
              colors={isRecording ? ['#FF6B6B', '#FF9999'] : ['#2E8B57', '#5FBC8D']}
              style={styles.circleGradient}
            >
              <Image
                source={require('../assets/images/favicon.png')}
                style={styles.aiIcon}
              />
            </LinearGradient>
            {isRecording && (
              <View style={styles.pulseRing} />
            )}
          </Animated.View>
        </View>

        {/* Conversation Terminal - Moved further down */}
        <View style={styles.terminal}>
          <LinearGradient
            colors={['#2E8B57', '#3CB371']}
            style={styles.terminalHeader}
          >
            <Text style={styles.terminalTitle}>FRIDAY</Text>
          </LinearGradient>
          <ScrollView style={styles.terminalBody}>
            {terminalText ? (
              <Text style={styles.responseText}>{terminalText}</Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isRecording ? 'Listening...' : 'Press the mic button to start speaking'}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {isLoading && (
          <ActivityIndicator size="small" color="#2E8B57" style={styles.loader} />
        )}
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording && styles.micButtonActive,
            isLoading && styles.micButtonDisabled
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
        >
          <Image
            source={require('../assets/images/favicon.png')}
            style={styles.micIcon}
          />
        </TouchableOpacity>
        <Text style={styles.tapText}>
          {isRecording ? 'Recording... Tap to stop' : 'Tap to speak'}
        </Text>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F0E0',
    elevation: 3,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-around', // Distributes space evenly
    paddingBottom: 20,
  },
  icon: {
    width: 24,
    height: 24,
  },
  logo: {
    height: 32,
    width: 130,
    resizeMode: 'contain',
  },
  aiVisualization: {
    alignItems: 'center',
    marginTop: 40, // Increased top margin
    marginBottom: 30, // Added bottom margin
  },
  voiceCircle: {
    width: 120,
    height: 120,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5, // Additional space above circle
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFFFFF',
  },
  pulseRing: {
    position: 'absolute',
    width: 180, // Slightly larger for better visibility
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    opacity: 0.4,
  },
  terminal: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    height: 200, // Fixed height
    marginBottom: 160, // Moved further down
  },
  terminalHeader: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  terminalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  terminalBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  responseText: {
    color: '#3E4A5B',
    fontSize: 15,
    lineHeight: 22,
  },
  placeholderText: {
    color: '#A3B2C8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micButtonActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  micButtonDisabled: {
    backgroundColor: '#A3D8B7',
  },
  micIcon: {
    width: 32,
    height: 32,
    tintColor: '#FFFFFF',
  },
  tapText: {
    marginTop: 10,
    color: '#2E8B57',
    fontSize: 15,
    fontWeight: '500',
  },
  loader: {
    marginBottom: 10,
  },
});