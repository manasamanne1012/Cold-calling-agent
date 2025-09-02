console.log('🔧 Starting AI Cold Call Dashboard Server...');

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('✅ Dependencies loaded successfully');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('✅ Middleware configured');

// In-memory storage for demo analytics
let analyticsData = {
    totalLeads: 150,
    callsCompleted: 89,
    pendingCalls: 61,
    meetingsBooked: 23,
    successRate: 26,
    avgDuration: '4m 32s',
    dailyStats: [],
    callOutcomes: {
        meetings: 23,
        followup: 31,
        notInterested: 18,
        noAnswer: 17
    },
    lastUpdated: new Date()
};

// Generate sample daily stats
function generateDailyStats() {
    const stats = [];
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        stats.push({
            date: date.toISOString().split('T')[0],
            calls: Math.floor(Math.random() * 20) + 10,
            meetings: Math.floor(Math.random() * 8) + 2,
            successRate: Math.floor(Math.random() * 30) + 15
        });
    }
    return stats;
}

analyticsData.dailyStats = generateDailyStats();

console.log('✅ Analytics data initialized');

// Routes

// Root route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

// Dashboard data endpoint
app.get('/api/dashboard-data', (req, res) => {
    try {
        const variation = () => Math.floor(Math.random() * 5) - 2;
        
        const currentData = {
            ...analyticsData,
            totalLeads: Math.max(analyticsData.totalLeads + variation(), 0),
            callsCompleted: Math.max(analyticsData.callsCompleted + Math.abs(variation()), 0),
            pendingCalls: Math.max(analyticsData.pendingCalls + variation(), 0),
            meetingsBooked: Math.max(analyticsData.meetingsBooked + Math.abs(variation()), 0),
            lastUpdated: new Date()
        };
        
        if (currentData.callsCompleted > 0) {
            currentData.successRate = Math.round((currentData.meetingsBooked / currentData.callsCompleted) * 100);
        }
        
        console.log('📊 Dashboard data requested');
        res.json({
            success: true,
            data: currentData
        });
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch dashboard data' 
        });
    }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
        const filteredStats = analyticsData.dailyStats.slice(-days);
        
        const analyticsResponse = {
            summary: {
                totalCalls: filteredStats.reduce((sum, stat) => sum + stat.calls, 0),
                totalMeetings: filteredStats.reduce((sum, stat) => sum + stat.meetings, 0),
                averageSuccessRate: Math.round(
                    filteredStats.reduce((sum, stat) => sum + stat.successRate, 0) / filteredStats.length
                )
            },
            dailyStats: filteredStats,
            callOutcomes: analyticsData.callOutcomes,
            period: period
        };
        
        console.log(`📈 Analytics data requested for period: ${period}`);
        res.json({
            success: true,
            data: analyticsResponse
        });
    } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch analytics data' 
        });
    }
});

// Campaign status endpoint
app.get('/api/campaign-status', (req, res) => {
    try {
        const status = {
            isActive: Math.random() > 0.7,
            currentCalls: Math.floor(Math.random() * 10),
            queuedCalls: Math.floor(Math.random() * 50),
            lastCampaignStart: new Date(Date.now() - Math.random() * 86400000),
            systemHealth: {
                aiAgent: 'active',
                googleSheets: 'connected',
                webhook: 'ready',
                vapi: 'active'
            }
        };
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('❌ Error fetching campaign status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch campaign status' 
        });
    }
});

// Activity feed endpoint
app.get('/api/activity', (req, res) => {
    try {
        const activities = [
            {
                id: 1,
                title: 'Campaign Completed',
                description: `Successfully completed calling session with ${Math.floor(Math.random() * 10) + 5} meetings booked`,
                type: 'success',
                timestamp: new Date(Date.now() - Math.random() * 3600000)
            },
            {
                id: 2,
                title: 'Lead Database Updated',
                description: `${Math.floor(Math.random() * 20) + 10} new leads added to the system`,
                type: 'info',
                timestamp: new Date(Date.now() - Math.random() * 7200000)
            },
            {
                id: 3,
                title: 'System Health Check',
                description: 'All systems operational and ready for campaigns',
                type: 'success',
                timestamp: new Date(Date.now() - Math.random() * 10800000)
            }
        ];
        
        res.json({
            success: true,
            data: activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        });
    } catch (error) {
        console.error('❌ Error fetching activity feed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch activity feed' 
        });
    }
});

// Workflow trigger endpoint
app.post('/api/trigger-workflow', async (req, res) => {
    console.log('🚀 Workflow trigger request received');
    
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!webhookUrl) {
            console.log('⚠️  Running in demo mode');
            
            setTimeout(() => {
                analyticsData.pendingCalls += Math.floor(Math.random() * 10) + 5;
                analyticsData.lastUpdated = new Date();
            }, 2000);
            
            return res.json({ 
                success: true, 
                message: 'Workflow started successfully (Demo Mode)',
                mode: 'demo',
                timestamp: new Date().toISOString()
            });
        }

        const response = await axios.post(webhookUrl, req.body, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AI-Cold-Call-Client/1.0'
            }
        });

        console.log('✅ Workflow triggered successfully');
        res.json({ 
            success: true, 
            message: 'Workflow started successfully',
            timestamp: new Date().toISOString(),
            n8nResponse: response.status
        });

    } catch (error) {
        console.error('❌ Error triggering workflow:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to trigger workflow',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

console.log('✅ Routes configured');

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 Server Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

console.log('✅ Error handlers configured');

// Start server
app.listen(PORT, () => {
    console.log('🚀 AI Cold Call Dashboard Server Started Successfully!');
    console.log('=' .repeat(60));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 Webhook: ${process.env.N8N_WEBHOOK_URL || 'Demo mode'}`);
    console.log('📊 API Endpoints:');
    console.log('   GET  /api/dashboard-data - Dashboard metrics');
    console.log('   GET  /api/analytics - Analytics data');
    console.log('   GET  /api/campaign-status - Campaign status');
    console.log('   GET  /api/activity - Activity feed');
    console.log('   POST /api/trigger-workflow - Start campaign');
    console.log('   GET  /api/health - Health check');
    console.log('=' .repeat(60));
    console.log(`⏰ Started: ${new Date().toLocaleString()}`);
    
    if (!process.env.N8N_WEBHOOK_URL) {
        console.log('⚠️  Demo mode: Set N8N_WEBHOOK_URL in .env for production');
    }
});

console.log('✅ Server setup complete - waiting for startup...');
