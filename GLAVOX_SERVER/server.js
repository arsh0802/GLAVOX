const app = require('./src/app');
const connectDB = require('./src/config/db');
require('dotenv').config();
const cors = require("cors");
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle sign language recognition data
  socket.on('sign_language_data', (data) => {
    // Process the sign language data
    console.log('Received sign language data:', data);
    
    // Broadcast the processed data back to all clients
    io.emit('sign_language_result', {
      gesture: data.gesture,
      text: data.text,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB
connectDB();

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌐 Accessible at http://192.168.170.195:${PORT}`); // Replace with your actual IP
  console.log(`🔌 WebSocket server is running on ws://192.168.170.195:${PORT}`); // Replace with your actual IP
});
