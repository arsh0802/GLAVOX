import torch
import torch.nn as nn

class SimpleTTS(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(SimpleTTS, self).__init__()
        self.encoder = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.decoder = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.linear = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        encoded, _ = self.encoder(x)
        decoded, _ = self.decoder(encoded)
        output = self.linear(decoded)
        return output 