const express = require('express');
const cors = require('cors');
const app = express();
const authMiddleware = require('./middleware/authMiddleware');

// 🔁 Route Imports
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const speechRoutes = require('./routes/speechRoutes');
//const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const speechAnalysisRoutes = require('./routes/speechAnalysisRoutes');
const profileRoutes = require('./routes/profileRoutes');

// 🌐 Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 📁 Serve Static Files (for audio etc.)
app.use(express.static('public'));

// 📌 API Routes
app.use('/api/auth', authRoutes); // Auth routes don't need protection

// Protected Routes
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/speech', authMiddleware, speechRoutes);
//app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/speech', authMiddleware, speechAnalysisRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);









// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

module.exports = app;