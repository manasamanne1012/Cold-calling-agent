const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

console.log('🔧 Starting AI Cold Call Agent Server...');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('✅ Middleware configured');

// In-memory analytics data
let analyticsData = {
    totalLeads: 150,
    callsCompleted: 89,
    pendingCalls: 61,
    meetingsBooked: 23,
    successRate: 26,
    avgDuration: '4m 32s',
    callOutcomes: {
        meetings: 23,
        followup: 31,
        notInterested: 18,
        noAnswer: 17
    },
    lastUpdated: new Date()
};

console.log('✅ Analytics data initialized');

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
console.log('✅ Daily stats generated');

// Routes
app.get('/', (req, res) => {
    console.log('📄 Root route accessed');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        server: 'AI Cold Call Agent'
    });
});

app.get('/api/dashboard-data', (req, res) => {
    try {
        console.log('📊 Dashboard data requested');
        res.json({
            success: true,
            data: {
                ...analyticsData,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch dashboard data' 
        });
    }
});

app.get('/api/analytics', (req, res) => {
    try {
        console.log('📈 Analytics data requested');
        res.json({
            success: true,
            data: {
                dailyStats: analyticsData.dailyStats,
                trends: {
                    callsThisWeek: 167,
                    meetingsThisWeek: 34,
                    conversionRate: 20.4,
                    trend: 'up'
                }
            }
        });
    } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch analytics' 
        });
    }
});

app.get('/api/activity', (req, res) => {
    try {
        console.log('📋 Activity feed requested');
        const activities = [
            {
                id: 1,
                type: 'call',
                title: 'Call completed with John Smith',
                timestamp: new Date(Date.now() - 300000)
            },
            {
                id: 2,
                type: 'meeting',
                title: 'Meeting scheduled with Sarah Johnson',
                timestamp: new Date(Date.now() - 900000)
            },
            {
                id: 3,
                type: 'call',
                title: 'Follow-up call with Mike Davis',
                timestamp: new Date(Date.now() - 1800000)
            }
        ];
        
        res.json(activities);
    } catch (error) {
        console.error('❌ Error fetching activity:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch activity' 
        });
    }
});

app.post('/api/trigger-workflow', async (req, res) => {
    try {
        console.log('🚀 Triggering AI Cold Call workflow...');
        
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!webhookUrl) {
            console.log('⚠️  Demo mode: No webhook URL configured');
            res.json({ 
                success: true, 
                message: 'Demo: AI Cold Call workflow triggered (no webhook configured)',
                workflowId: 'demo-' + Date.now()
            });
            return;
        }
        
        const response = await axios.post(webhookUrl, {
            trigger: 'manual',
            timestamp: new Date().toISOString(),
            source: 'dashboard'
        });
        
        console.log('✅ Workflow triggered successfully');
        res.json({ 
            success: true, 
            message: 'AI Cold Call workflow triggered successfully',
            workflowId: response.data?.executionId || 'live-' + Date.now()
        });
        
    } catch (error) {
        console.error('❌ Error triggering workflow:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to trigger workflow: ' + error.message 
        });
    }
});

app.get('/api/campaign-status', (req, res) => {
    try {
        console.log('📞 Campaign status requested');
        res.json({
            success: true,
            data: {
                status: 'active',
                currentCampaign: 'Q3 2024 Cold Outreach',
                startTime: new Date(Date.now() - 3600000).toISOString(),
                callsInProgress: 3,
                queueSize: analyticsData.pendingCalls,
                lastCallTime: new Date(Date.now() - 300000).toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error fetching campaign status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch campaign status' 
        });
    }
});

app.get('/api/leads/stats', (req, res) => {
    try {
        console.log('👥 Leads stats requested');
        res.json({
            success: true,
            data: {
                totalLeads: analyticsData.totalLeads,
                newThisWeek: 23,
                qualifiedLeads: 67,
                uncontacted: analyticsData.pendingCalls,
                inProgress: 12,
                completed: analyticsData.callsCompleted
            }
        });
    } catch (error) {
        console.error('❌ Error fetching leads stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch leads statistics' 
        });
    }
});

app.get('/api/export/:type?', (req, res) => {
    try {
        console.log('📤 Export requested:', req.params.type);
        const type = req.params.type || 'csv';
        
        if (type === 'csv') {
            const csvData = 'Date,Calls,Meetings,Success Rate\n' +
                analyticsData.dailyStats?.map(stat => 
                    `${stat.date},${stat.calls},${stat.meetings},${stat.successRate}%`
                ).join('\n') || 'No data available';
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.csv');
            res.send(csvData);
        } else {
            res.json({
                success: true,
                data: analyticsData,
                exportedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to export data' 
        });
    }
});

console.log('✅ Routes configured');

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 Server Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

console.log('✅ Error handlers configured');

// Start server
app.listen(PORT, () => {
    console.log('🚀 AI Cold Call Dashboard Server Started');
    console.log('=' .repeat(50));
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Webhook URL: ${process.env.N8N_WEBHOOK_URL || 'Not configured (Demo mode)'}`);
    console.log(`📊 API Endpoints available:`);
    console.log(`   GET  /api/health - System health check`);
    console.log(`   GET  /api/dashboard-data - Real-time dashboard metrics`);
    console.log(`   GET  /api/analytics - Advanced analytics`);
    console.log(`   GET  /api/activity - Recent activity feed`);
    console.log(`   POST /api/trigger-workflow - Start AI calling campaign`);
    console.log(`   GET  /api/campaign-status - Current campaign info`);
    console.log(`   GET  /api/leads/stats - Lead database statistics`);
    console.log(`   GET  /api/export - Export data in CSV/JSON`);
    console.log('=' .repeat(50));
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    
    if (!process.env.N8N_WEBHOOK_URL) {
        console.log('⚠️  WARNING: N8N_WEBHOOK_URL not set - running in demo mode');
    }
});

console.log('✅ Server setup complete - waiting for listen callback...');
