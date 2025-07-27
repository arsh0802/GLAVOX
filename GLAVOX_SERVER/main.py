"""
GLAVOX - Sign Language Recognition System
Main application file that handles real-time sign language recognition and speech synthesis.
"""

import cv2
import numpy as np 
import sounddevice as sd
import logging
import time 
from pathlib import Path 
from video_processing.hand_detection import HandDetector
from video_processing.gesture_recognition import GestureRecognizer
from text_to_speech.speech_synthesis import SpeechSynthesizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('glavox.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SignLanguageApp:
    """Main application class for sign language recognition."""
    
    def __init__(self):
        """Initialize the application components and settings."""
        self.gesture_map = {
            0: "A", 1: "B", 2: "C", 3: "D", 4: "E",
            5: "F", 6: "G", 7: "H", 8: "I", 9: "J",
            10: "K", 11: "L", 12: "M", 13: "N", 14: "O",
            15: "P", 16: "Q", 17: "R", 18: "S", 19: "T",
            20: "U", 21: "V", 22: "W", 23: "X", 24: "Y",
            25: "Z"
        }
        self.last_gesture = None
        self.gesture_history = []
        self.is_running = False
        
        # Initialize components
        try:
            self.initialize_components()
        except Exception as e:
            logger.error(f"Failed to initialize components: {str(e)}")
            raise

    def initialize_components(self):
        """Initialize all required components with proper error handling."""
        try:
            self.hand_detector = HandDetector()
            self.gesture_recognizer = GestureRecognizer(
                model_path='models/sign_language_model.pth',
                num_classes=26
            )
            self.speech_synthesizer = SpeechSynthesizer(
                model_path='models/tts_model.pth',
                input_dim=256,
                hidden_dim=512,
                output_dim=80
            )
            logger.info("All components initialized successfully")
        except Exception as e:
            logger.error(f"Component initialization failed: {str(e)}")
            raise

    def convert_gesture_to_text(self, gesture):
        """Convert gesture index to corresponding text."""
        return self.gesture_map.get(gesture, "Unknown")

    def play_audio(self, audio):
        """Play audio with error handling."""
        try:
            sd.play(audio, samplerate=16000)
            sd.wait()
        except Exception as e:
            logger.error(f"Audio playback failed: {str(e)}")

    def process_frame(self, frame):
        """Process a single video frame for sign language recognition."""
        try:
            # Detect hands
            frame, hand_landmarks = self.hand_detector.detect_hands(frame)

            if hand_landmarks:
                # Recognize gesture
                gesture = self.gesture_recognizer.predict(frame)
                text = self.convert_gesture_to_text(gesture)
                
                # Update gesture history
                if text != self.last_gesture:
                    self.gesture_history.append(text)
                    self.last_gesture = text
                
                # Display text on frame
                cv2.putText(frame, text, (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                
                # Synthesize speech
                audio = self.speech_synthesizer.synthesize(text)
                self.play_audio(audio)

            return frame
        except Exception as e:
            logger.error(f"Frame processing failed: {str(e)}")
            return frame

    def run(self):
        """Main application loop."""
        logger.info("Starting GLAVOX application...")
        self.is_running = True
        
        try:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                raise Exception("Failed to open camera")

            while self.is_running:
                ret, frame = cap.read()
                if not ret:
                    logger.error("Failed to capture frame")
                    break

                # Process frame
                processed_frame = self.process_frame(frame)
                
                # Display frame
                cv2.imshow('GLAVOX - Sign Language Recognition', processed_frame)
                
                # Check for exit command
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    logger.info("User requested exit")
                    break

        except Exception as e:
            logger.error(f"Application error: {str(e)}")
        finally:
            self.cleanup(cap)

    def cleanup(self, cap):
        """Clean up resources."""
        logger.info("Cleaning up resources...")
        if cap is not None:
            cap.release()
        cv2.destroyAllWindows()
        self.is_running = False

def main():
    """Main entry point of the application."""
    try:
        app = SignLanguageApp()
        app.run()
    except Exception as e:
        logger.error(f"Application failed to start: {str(e)}")
        raise

if __name__ == "__main__":
    main() 