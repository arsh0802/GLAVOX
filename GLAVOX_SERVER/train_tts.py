import torch
import torch.nn as nn
from ml_models.tts_model.model import SimpleTTS
from torch.utils.data import DataLoader, TensorDataset
import numpy as np

def create_sample_data(num_samples=1000, seq_length=50):
    # Create random sample data for demonstration
    X = torch.randn(num_samples, seq_length, 256)  # Input features
    y = torch.randn(num_samples, seq_length, 80)   # Output audio features
    return X, y

def train_tts_model(model, train_loader, val_loader, num_epochs=10):
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        
        for inputs, targets in train_loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
            
        # Validation
        model.eval()
        val_loss = 0.0
        
        with torch.no_grad():
            for inputs, targets in val_loader:
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss += loss.item()
        
        print(f'Epoch {epoch+1}/{num_epochs}:')
        print(f'Training Loss: {running_loss/len(train_loader):.4f}')
        print(f'Validation Loss: {val_loss/len(val_loader):.4f}')

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
    model = SimpleTTS(input_dim=256, hidden_dim=512, output_dim=80)
    
    # Train model
    train_tts_model(model, train_loader, val_loader, num_epochs=10)
    
    # Save model
    torch.save(model.state_dict(), 'tts_model.pth')
    print("Model saved as 'tts_model.pth'")

if __name__ == "__main__":
    main() 