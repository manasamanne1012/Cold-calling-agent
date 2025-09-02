console.log('🔧 Starting clean server...');

const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('✅ Dependencies loaded');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('✅ Middleware configured');

// Routes
app.get('/', (req, res) => {
    console.log('📄 Root route accessed');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('✅ Routes configured');

// Start server
app.listen(PORT, () => {
    console.log('🚀 Clean server started successfully!');
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
});

console.log('✅ Server setup complete - waiting for listen callback...');
