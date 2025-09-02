console.log('🔧 Starting Simple AI Cold Call Server...');

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple analytics data
const analytics = {
    totalLeads: 150,
    callsMade: 89,
    meetingsBooked: 23,
    successRate: 26
};

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Simple stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        data: analytics
    });
});

// Workflow trigger
app.post('/api/trigger-workflow', async (req, res) => {
    console.log('🚀 Triggering workflow...');
    
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (webhookUrl) {
            const response = await axios.post(webhookUrl, {
                trigger: 'manual',
                timestamp: new Date().toISOString(),
                source: 'simple-dashboard'
            });
            
            res.json({ 
                success: true, 
                message: 'Workflow triggered successfully!',
                workflowId: response.data?.executionId || 'workflow-' + Date.now()
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Demo: Workflow triggered (no webhook configured)',
                workflowId: 'demo-' + Date.now()
            });
        }
    } catch (error) {
        console.error('❌ Workflow error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to trigger workflow: ' + error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Simple AI Cold Call Server Started');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🔗 Webhook URL: ${process.env.N8N_WEBHOOK_URL || 'Demo mode'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
});

console.log('✅ Simple server setup complete');
