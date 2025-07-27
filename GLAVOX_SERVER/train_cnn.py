import torch
import torch.nn as nn
from ml_models.sign_language_cnn.model import SignLanguageCNN
from ml_models.sign_language_cnn.train import train_model
from torch.utils.data import DataLoader, TensorDataset
import numpy as np

def create_sample_data(num_samples=1000, num_classes=26):
    # Create random sample data for demonstration
    X = torch.randn(num_samples, 3, 224, 224)  # RGB images of size 224x224
    y = torch.randint(0, num_classes, (num_samples,))
    return X, y

def main():
    # Create sample data
    X_train, y_train = create_sample_data(1000)
    X_val, y_val = create_sample_data(200)
    
    # Create data loaders
    train_dataset = TensorDataset(X_train, y_train)
    val_dataset = TensorDataset(X_val, y_val)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32)
    
    # Initialize model
    model = SignLanguageCNN(num_classes=26)
    
    # Train model
    train_model(model, train_loader, val_loader, num_epochs=10)
    
    # Save model
    torch.save(model.state_dict(), 'sign_language_model.pth')
    print("Model saved as 'sign_language_model.pth'")

if __name__ == "__main__":
    main() 