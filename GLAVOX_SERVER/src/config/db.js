const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('✅ MongoDB Already Connected');
            return mongoose.connection;
        }

        // Connect to local MongoDB
        const conn = await mongoose.connect('mongodb+srv://s8634878:t9QxpzL5Vunmz89X@cluster0.3wonooh.mongodb.net/', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            // Attempt to reconnect
            setTimeout(connectDB, 5000);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('❌ MongoDB disconnected');
            // Attempt to reconnect
            setTimeout(connectDB, 5000);
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

        return conn.connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
        throw error;
    }
};

module.exports = connectDB;