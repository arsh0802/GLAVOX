import torch
import numpy as np
import cv2
from ml_models.sign_language_cnn.model import SignLanguageCNN

class GestureRecognizer:
    def __init__(self, model_path, num_classes):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = SignLanguageCNN(num_classes)
        self.model.load_state_dict(torch.load(model_path))
        self.model.to(self.device)
        self.model.eval()

    def preprocess_frame(self, frame):
        # Resize and normalize frame
        frame = cv2.resize(frame, (224, 224))
        frame = frame / 255.0
        frame = torch.FloatTensor(frame).permute(2, 0, 1).unsqueeze(0)
        return frame.to(self.device)

    def predict(self, frame):
        with torch.no_grad():
            processed_frame = self.preprocess_frame(frame)
            output = self.model(processed_frame)
            prediction = torch.argmax(output, dim=1)
            return prediction.item() 