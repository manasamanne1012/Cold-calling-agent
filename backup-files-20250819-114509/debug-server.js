const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

console.log('🔧 Starting server initialization...');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('✅ Express app created');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('✅ Middleware configured');

// Simple test route
app.get('/', (req, res) => {
    console.log('📍 Root route accessed');
    res.json({ 
        message: 'AI Cold Call Dashboard Server is running!',
        timestamp: new Date().toISOString()
    });
});

console.log('✅ Routes configured');

// Start server with error handling
try {
    const server = app.listen(PORT, () => {
        console.log('🚀 Server started successfully!');
        console.log(`📍 Server running on: http://localhost:${PORT}`);
        console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    });
    
    server.on('error', (error) => {
        console.error('❌ Server error:', error);
        process.exit(1);
    });
    
    console.log('✅ Server listen call completed');
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}

console.log('✅ Server setup complete');
