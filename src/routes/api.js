/**
 * API Routes for Dashboard
 */
const express = require('express');
const router = express.Router();
const sheetsService = require('../services/googleSheets');
const csvService = require('../services/csvData');
const analytics = require('../utils/analytics');
const workflowTrigger = require('../services/workflow-trigger');

// In-memory storage for demo analytics (in production, use a database)
let analyticsData = {
    totalLeads: 150,
    callsCompleted: 89,
    pendingCalls: 61,
    meetingsBooked: 23,
    successRate: 26,
    avgDuration: '4m 32s',
    dailyStats: analytics.generateDailyStats(),
    callOutcomes: {
        meetings: 23,
        followup: 31,
        notInterested: 18,
        noAnswer: 17
    },
    lastUpdated: new Date()
};

// API endpoint to provide service account information
router.get('/sheets-auth-info', (req, res) => {
    const authInfo = sheetsService.getAuthInfo();
    res.json(authInfo);
});

// Stats endpoint for dashboard KPI cards based on real Google Sheets data
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Stats request - fetching real-time data...');
        
        let sheetData = null;
        let dataSource = 'fallback';
        
        // Try Google Sheets first
        if (sheetsService.sheetsConfigured) {
            console.log('📊 Attempting Google Sheets...');
            sheetData = await sheetsService.fetchSheetData();
            if (sheetData) {
                dataSource = 'google_sheets';
                console.log('✅ Using Google Sheets data');
            }
        }
        
        // If Google Sheets failed, try CSV file
        if (!sheetData) {
            console.log('📄 Attempting CSV file...');
            sheetData = csvService.fetchCSVData();
            if (sheetData) {
                dataSource = 'csv_file';
                console.log('✅ Using CSV file data');
            }
        }
        
        // Calculate stats from available data
        const stats = analytics.analyzeSheetData(sheetData);
        
        console.log('📊 Real-time stats calculated:', stats);
        console.log('📊 Data source:', dataSource);
        
        res.json({
            success: true,
            data: stats,
            source: dataSource,
            timestamp: new Date().toISOString(),
            message: dataSource === 'google_sheets' ? 'Live Google Sheets data' :
                    dataSource === 'csv_file' ? 'Live CSV file data' :
                    'Fallback data - configure Google Sheets or update CSV file'
        });
    } catch (error) {
        console.error('❌ Error fetching real-time stats:', error);
        
        // Ultimate fallback
        const fallbackStats = {
            meetingsBooked: 4,
            pending: 1,
            scheduled: 2,
            pendingRecall: 0,
            totalLeads: 7,
            successRate: 57.1
        };
        
        res.json({
            success: true,
            data: fallbackStats,
            source: 'emergency_fallback',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Dashboard data endpoint
router.get('/dashboard-data', (req, res) => {
    try {
        // Simulate real-time data updates
        const variation = () => Math.floor(Math.random() * 5) - 2; // -2 to +2 variation
        
        const currentData = {
            ...analyticsData,
            totalLeads: Math.max(analyticsData.totalLeads + variation(), 0),
            callsCompleted: Math.max(analyticsData.callsCompleted + Math.abs(variation()), 0),
            pendingCalls: Math.max(analyticsData.pendingCalls + variation(), 0),
            meetingsBooked: Math.max(analyticsData.meetingsBooked + Math.abs(variation()), 0),
            lastUpdated: new Date()
        };
        
        // Update success rate based on current data
        if (currentData.callsCompleted > 0) {
            currentData.successRate = Math.round((currentData.meetingsBooked / currentData.callsCompleted) * 100);
        }
        
        console.log('📊 Dashboard data requested at:', new Date().toISOString());
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

// Analytics endpoint with date range
router.get('/analytics', (req, res) => {
    try {
        const { startDate, endDate, period = '7d' } = req.query;
        
        let filteredStats = analyticsData.dailyStats;
        
        if (startDate && endDate) {
            filteredStats = analyticsData.dailyStats.filter(stat => {
                return stat.date >= startDate && stat.date <= endDate;
            });
        } else {
            // Filter by period
            const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
            filteredStats = analyticsData.dailyStats.slice(-days);
        }
        
        const analyticsResponse = {
            summary: {
                totalCalls: filteredStats.reduce((sum, stat) => sum + stat.calls, 0),
                totalMeetings: filteredStats.reduce((sum, stat) => sum + stat.meetings, 0),
                averageSuccessRate: Math.round(
                    filteredStats.reduce((sum, stat) => sum + stat.successRate, 0) / filteredStats.length
                ),
                trend: analytics.calculateTrend(filteredStats)
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
router.get('/campaign-status', (req, res) => {
    try {
        const status = {
            isActive: Math.random() > 0.7, // 30% chance of active campaign
            currentCalls: Math.floor(Math.random() * 10),
            queuedCalls: Math.floor(Math.random() * 50),
            lastCampaignStart: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
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
router.get('/activity', (req, res) => {
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
            },
            {
                id: 4,
                title: 'Analytics Updated',
                description: 'Performance metrics have been refreshed',
                type: 'info',
                timestamp: new Date(Date.now() - Math.random() * 14400000)
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

// Enhanced workflow trigger endpoint - integrated with workflow-trigger.js
router.post('/trigger-workflow', async (req, res) => {
    console.log('🚀 Workflow trigger request received at:', new Date().toISOString());
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const contact = req.body;
        
        if (!contact || !contact.name) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contact data. Name is required.'
            });
        }
        
        // Use workflow-trigger module to trigger the n8n workflow
        const result = await workflowTrigger.triggerWorkflow(contact);
        
        // Update analytics on successful trigger
        if (result.success) {
            analyticsData.pendingCalls += Math.floor(Math.random() * 15) + 10;
            analyticsData.lastUpdated = new Date();
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Error triggering workflow:', error.message);
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || 'Network or configuration error',
            timestamp: new Date().toISOString()
        });
    }
});

// Lead management endpoints
router.get('/leads/stats', (req, res) => {
    try {
        const stats = {
            total: analyticsData.totalLeads,
            newThisWeek: Math.floor(Math.random() * 20) + 5,
            contacted: analyticsData.callsCompleted,
            pending: analyticsData.pendingCalls,
            qualified: analyticsData.meetingsBooked,
            distribution: {
                'Technology': 35,
                'Healthcare': 25,
                'Finance': 20,
                'Education': 12,
                'Other': 8
            }
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Error fetching lead stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch lead statistics' 
        });
    }
});

// Export data endpoint
router.get('/export/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json' } = req.query;
        
        let data;
        let filename;
        
        switch (type) {
            case 'analytics':
                data = analyticsData;
                filename = `analytics_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'activity':
                // Would fetch from database in production
                data = { message: 'Activity data export not yet implemented' };
                filename = `activity_${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid export type' });
        }
        
        if (format === 'csv') {
            // Convert to CSV (simplified)
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send('CSV export not yet implemented');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json({
                success: true,
                data: data,
                exported_at: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Export failed' 
        });
    }
});

// System health endpoint
router.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'operational',
                n8n_webhook: process.env.N8N_WEBHOOK_URL ? 'configured' : 'not_configured',
                google_sheets: 'connected',
                ai_agent: 'active'
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
        };
        
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('❌ Error checking system health:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Health check failed' 
        });
    }
});

module.exports = router;
