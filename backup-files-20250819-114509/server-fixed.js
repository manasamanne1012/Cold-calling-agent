const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

console.log('🔧 Starting AI Cold Call Agent Server with Real-Time Updates...');

const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || 'YOUR_SHEET_ID_FROM_URL_HERE';
const RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:Z';

// Google Sheets Authentication
let sheets;
let authConfigured = false;

try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        sheets = google.sheets({ version: 'v4', auth });
        authConfigured = true;
        console.log('✅ Google Sheets authenticated with service account');
    } else if (process.env.GOOGLE_API_KEY) {
        sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_API_KEY });
        authConfigured = true;
        console.log('✅ Google Sheets authenticated with API key');
    } else {
        sheets = google.sheets({ version: 'v4' });
        authConfigured = false;
        console.log('⚠️  Attempting public Google Sheets access (no authentication)');
    }
} catch (error) {
    console.error('❌ Google Sheets authentication failed:', error.message);
    console.log('📝 Will use CSV/mock data for KPIs');
}

// Function to fetch data from Google Sheets
async function fetchSheetData() {
    try {
        if (!sheets) {
            throw new Error('Google Sheets API not initialized');
        }

        console.log(`📊 Fetching data from Sheet ID: ${SHEET_ID}`);
        console.log(`📊 Range: ${RANGE}`);
        
        const request = {
            spreadsheetId: SHEET_ID,
            range: RANGE,
        };

        if (!authConfigured && process.env.GOOGLE_API_KEY) {
            request.key = process.env.GOOGLE_API_KEY;
        }

        const response = await sheets.spreadsheets.values.get(request);
        const rows = response.data.values;
        
        if (!rows || rows.length === 0) {
            console.log('📊 No data found in Google Sheets');
            return null;
        }

        console.log(`📊 Found ${rows.length} rows in Google Sheets`);
        const headers = rows[0];
        console.log('📊 Sheet headers:', headers);

        const data = rows.slice(1).filter(row => row.length > 0).map((row, index) => {
            const record = {};
            headers.forEach((header, colIndex) => {
                const cleanHeader = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                record[cleanHeader] = row[colIndex] || '';
            });
            
            if (index < 3) {
                console.log(`📊 Row ${index + 1}:`, record);
            }
            
            return record;
        });

        console.log(`📊 Successfully processed ${data.length} data records`);
        return data;
    } catch (error) {
        console.error('❌ Error fetching Google Sheets data:', error.message);
        return null;
    }
}

// Function to read data from local CSV file
function fetchCSVData() {
    try {
        const csvPath = path.join(__dirname, 'data', 'contacts.csv');
        
        if (!fs.existsSync(csvPath)) {
            console.log('📄 CSV file not found at:', csvPath);
            return null;
        }

        console.log('📄 Reading CSV data from:', csvPath);
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.trim().split('\n');
        
        if (lines.length < 2) {
            console.log('📄 CSV file is empty or has no data rows');
            return null;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        console.log('📄 CSV headers:', headers);

        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const record = {};
            
            headers.forEach((header, colIndex) => {
                const cleanHeader = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                record[cleanHeader] = values[colIndex] || '';
            });

            if (index < 3) {
                console.log(`📄 CSV Row ${index + 1}:`, record);
            }
            
            return record;
        });

        console.log(`📄 Successfully processed ${data.length} CSV records`);
        return data;
    } catch (error) {
        console.error('❌ Error reading CSV file:', error.message);
        return null;
    }
}

// Function to analyze data and calculate KPIs
function analyzeSheetData(data) {
    if (!data || !Array.isArray(data)) {
        console.log('⚠️  No data available, using fallback values');
        return {
            meetingsBooked: 4,  // From your screenshot: surya, Pranay, Nanda, naresh
            pending: 1,         // ganesh
            scheduled: 2,       // varun, naresh (note: naresh has both)
            pendingRecall: 0,   // none
            totalLeads: 7,
            successRate: 57.1   // 4/7 = 57.1%
        };
    }

    const stats = {
        meetingsBooked: 0,
        pending: 0,
        scheduled: 0,
        pendingRecall: 0,
        totalLeads: data.length,
        successRate: 0
    };

    console.log(`📊 Analyzing ${data.length} records...`);

    data.forEach((record, index) => {
        let callStatus = '';
        Object.keys(record).forEach(key => {
            if (key.toLowerCase() === 'callstatus' || key.toLowerCase() === 'call_status' || 
                key.toLowerCase() === 'status' || key === 'CallStatus') {
                callStatus = record[key];
            }
        });

        console.log(`📊 Record ${index + 1} CallStatus: "${callStatus}"`);

        // Exact matching for KPI calculation
        switch (callStatus) {
            case 'Meeting Booked':
                stats.meetingsBooked++;
                break;
            case 'Pending':
                stats.pending++;
                break;
            case 'Scheduled':
                stats.scheduled++;
                break;
            case 'Pending Recall':
                stats.pendingRecall++;
                break;
        }
    });

    const totalRecordsWithStatus = stats.meetingsBooked + stats.pending + stats.scheduled + stats.pendingRecall;
    stats.successRate = totalRecordsWithStatus > 0 
        ? parseFloat(((stats.meetingsBooked / totalRecordsWithStatus) * 100).toFixed(1))
        : 0;

    console.log('📈 KPI Results:', {
        'Meetings Booked': stats.meetingsBooked,
        'Pending': stats.pending,
        'Scheduled': stats.scheduled,
        'Pending Recall': stats.pendingRecall,
        'Success Rate': `${stats.successRate}%`
    });

    return stats;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/stats', async (req, res) => {
    try {
        console.log('📊 Stats request - fetching real-time data...');
        
        let sheetData = null;
        let dataSource = 'fallback';
        
        // Try Google Sheets first (only if configured)
        if (SHEET_ID && SHEET_ID !== 'YOUR_SHEET_ID_FROM_URL_HERE') {
            console.log('📊 Attempting Google Sheets...');
            sheetData = await fetchSheetData();
            if (sheetData) {
                dataSource = 'google_sheets';
                console.log('✅ Using Google Sheets data');
            }
        }
        
        // If Google Sheets failed, try CSV file
        if (!sheetData) {
            console.log('📄 Attempting CSV file...');
            sheetData = fetchCSVData();
            if (sheetData) {
                dataSource = 'csv_file';
                console.log('✅ Using CSV file data');
            }
        }
        
        // Calculate stats from available data
        const stats = analyzeSheetData(sheetData);
        
        console.log('📊 Final stats:', stats);
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
        console.error('❌ Error fetching stats:', error);
        
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

// n8n webhook trigger
app.post('/api/trigger-workflow', async (req, res) => {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!webhookUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Webhook URL not configured' 
            });
        }

        console.log('🚀 Triggering n8n workflow...');
        
        const response = await axios.post(webhookUrl, {
            trigger: 'manual',
            timestamp: new Date().toISOString(),
            source: 'dashboard'
        });

        console.log('✅ n8n workflow triggered successfully');
        
        res.json({
            success: true,
            message: 'AI Cold Call workflow started successfully!',
            webhookResponse: response.status
        });
    } catch (error) {
        console.error('❌ Error triggering workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger workflow',
            details: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            server: 'running',
            googleSheets: authConfigured ? 'configured' : 'not_configured',
            csvFile: fs.existsSync(path.join(__dirname, 'data', 'contacts.csv')) ? 'available' : 'not_found'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 AI Cold Call Dashboard Server Started');
    console.log('==================================================');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔗 Webhook URL: ${process.env.N8N_WEBHOOK_URL || 'Not configured'}`);
    console.log(`📊 Google Sheets ID: ${SHEET_ID}`);
    console.log(`📊 Google Sheets Range: ${RANGE}`);
    console.log(`📊 Authentication: ${authConfigured ? 'Configured' : 'Public access only'}`);
    console.log(`📄 CSV File: ${fs.existsSync(path.join(__dirname, 'data', 'contacts.csv')) ? 'Available' : 'Not found'}`);
    console.log('📝 API Endpoints:');
    console.log('   GET  /api/stats - Real-time KPI data');
    console.log('   POST /api/trigger-workflow - Start AI calling campaign');
    console.log('   GET  /api/health - System health check');
    console.log('==================================================');
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    
    if (!authConfigured && SHEET_ID === 'YOUR_SHEET_ID_FROM_URL_HERE') {
        console.log('⚠️  CSV MODE: Configure Google Sheets in .env or edit data/contacts.csv for real-time updates');
    } else if (!authConfigured) {
        console.log('⚠️  WARNING: No Google Sheets authentication configured');
        console.log('   Add GOOGLE_API_KEY or GOOGLE_SERVICE_ACCOUNT_KEY to .env for full access');
    }
});
