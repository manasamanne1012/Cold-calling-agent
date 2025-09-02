const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

console.log('🔧 Starting AI Cold Call Agent Server - CORRECTED KPI Logic...');

const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || 'YOUR_SHEET_ID_FROM_URL_HERE';
const RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:Z';

// KPI Status Mapping - Normalized status values for case-insensitive matching
const STATUS_MAPPING = {
    'meeting booked': 'Meeting Booked',
    'pending': 'Pending', 
    'scheduled': 'Scheduled',
    'pending recall': 'Pending Recall'
};

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

// Function to normalize Call Status for case-insensitive comparison
function normalizeCallStatus(status) {
    if (!status || typeof status !== 'string') {
        return null;
    }
    
    const normalized = status.trim().toLowerCase();
    return STATUS_MAPPING[normalized] || null;
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

// CORRECTED KPI CALCULATION FUNCTION
function calculateKPIs(data) {
    console.log('🧮 Starting KPI calculation with CORRECTED logic...');
    
    if (!data || !Array.isArray(data)) {
        console.log('⚠️  No data available, using fallback values');
        // Fallback values with CORRECT Success Rate formula
        return {
            meetings_booked: 2,
            pending: 2,
            scheduled: 2, 
            pending_recall: 2,
            success_rate_pct: 33.33 // 2/(2+2+2) = 33.33%
        };
    }

    // Initialize counters
    const kpis = {
        meetings_booked: 0,
        pending: 0,
        scheduled: 0,
        pending_recall: 0,
        success_rate_pct: 0
    };

    // Track unrecognized statuses for debugging
    const unrecognizedStatuses = new Set();
    const statusBreakdown = {};

    console.log(`🔍 Analyzing ${data.length} records with CORRECTED KPI logic...`);

    // Process each record
    data.forEach((record, index) => {
        // Find Call Status field (case-insensitive)
        let rawCallStatus = null;
        
        Object.keys(record).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'callstatus' || lowerKey === 'call_status' || 
                lowerKey === 'status' || key === 'CallStatus') {
                rawCallStatus = record[key];
            }
        });

        // Normalize the status
        const normalizedStatus = normalizeCallStatus(rawCallStatus);
        
        console.log(`📊 Record ${index + 1}: Raw="${rawCallStatus}" → Normalized="${normalizedStatus}"`);

        // Count for status breakdown
        const breakdownKey = rawCallStatus || 'NULL/EMPTY';
        statusBreakdown[breakdownKey] = (statusBreakdown[breakdownKey] || 0) + 1;

        // Increment KPI counters based on normalized status
        switch (normalizedStatus) {
            case 'Meeting Booked':
                kpis.meetings_booked++;
                break;
            case 'Pending':
                kpis.pending++;
                break;
            case 'Scheduled':
                kpis.scheduled++;
                break;
            case 'Pending Recall':
                kpis.pending_recall++;
                break;
            default:
                // Track unrecognized statuses
                if (rawCallStatus) {
                    unrecognizedStatuses.add(rawCallStatus);
                }
                console.log(`⚠️  Record ${index + 1}: Unrecognized status "${rawCallStatus}" - ignored in KPI calculation`);
                break;
        }
    });

    // CRITICAL: Calculate Success Rate with CORRECT formula
    // Success Rate = Meetings Booked / (Pending + Scheduled + Pending Recall) × 100
    const denominator = kpis.pending + kpis.scheduled + kpis.pending_recall;
    
    if (denominator === 0) {
        kpis.success_rate_pct = 0;
        console.log('⚠️  Success Rate denominator is 0 - setting to 0%');
    } else {
        kpis.success_rate_pct = parseFloat(((kpis.meetings_booked / denominator) * 100).toFixed(2));
    }

    // Comprehensive logging
    console.log('📈 CORRECTED KPI CALCULATION RESULTS:');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Input Records: ${data.length}`);
    console.log(`📊 Status Breakdown:`, statusBreakdown);
    console.log(`📊 Unrecognized Statuses:`, Array.from(unrecognizedStatuses));
    console.log('📊 KPI Counts:');
    console.log(`   • Meetings Booked: ${kpis.meetings_booked}`);
    console.log(`   • Pending: ${kpis.pending}`);
    console.log(`   • Scheduled: ${kpis.scheduled}`);
    console.log(`   • Pending Recall: ${kpis.pending_recall}`);
    console.log('📊 Success Rate Calculation:');
    console.log(`   • Formula: Meetings Booked / (Pending + Scheduled + Pending Recall) × 100`);
    console.log(`   • Calculation: ${kpis.meetings_booked} / (${kpis.pending} + ${kpis.scheduled} + ${kpis.pending_recall}) × 100`);
    console.log(`   • Calculation: ${kpis.meetings_booked} / ${denominator} × 100`);
    console.log(`   • Result: ${kpis.success_rate_pct}%`);
    console.log('═══════════════════════════════════════');

    return kpis;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/stats', async (req, res) => {
    try {
        console.log('📊 Stats request - fetching real-time data with CORRECTED KPI logic...');
        
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
        
        // Calculate KPIs with CORRECTED logic
        const kpis = calculateKPIs(sheetData);
        
        console.log('📊 Final CORRECTED KPIs:', kpis);
        console.log('📊 Data source:', dataSource);
        
        res.json({
            success: true,
            data: kpis,
            source: dataSource,
            timestamp: new Date().toISOString(),
            message: dataSource === 'google_sheets' ? 'Live Google Sheets data with CORRECTED KPI logic' :
                    dataSource === 'csv_file' ? 'Live CSV file data with CORRECTED KPI logic' :
                    'Fallback data with CORRECTED KPI logic',
            kpi_formula: {
                success_rate: 'Meetings Booked / (Pending + Scheduled + Pending Recall) × 100',
                note: 'Denominator excludes Meetings Booked as per requirements'
            }
        });
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        
        const fallbackKPIs = {
            meetings_booked: 2,
            pending: 2,
            scheduled: 2,
            pending_recall: 2,
            success_rate_pct: 33.33
        };
        
        res.json({
            success: true,
            data: fallbackKPIs,
            source: 'emergency_fallback',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Test endpoint with controlled dataset
app.get('/api/test-kpis', (req, res) => {
    console.log('🧪 Running KPI test with controlled dataset...');
    
    // Test dataset from requirements
    const testData = [
        { callstatus: 'Meeting Booked' },
        { callstatus: 'Pending' },
        { callstatus: 'Scheduled' },
        { callstatus: 'Pending Recall' },
        { callstatus: 'meeting booked' },  // case variation
        { callstatus: ' PENDING ' },       // whitespace variation
        { callstatus: 'Scheduled' },
        { callstatus: 'Pending Recall' },
        { callstatus: 'Unknown' },         // ignored status
        { callstatus: '' },                // empty status
        { callstatus: null }               // null status
    ];
    
    const results = calculateKPIs(testData);
    
    // Expected results from requirements
    const expected = {
        meetings_booked: 2,
        pending: 2,
        scheduled: 2,
        pending_recall: 2,
        success_rate_pct: 33.33
    };
    
    const testPassed = JSON.stringify(results) === JSON.stringify(expected);
    
    res.json({
        success: true,
        test_passed: testPassed,
        expected: expected,
        actual: results,
        test_data: testData,
        message: testPassed ? '✅ All KPI tests passed!' : '❌ KPI test failed - check calculation logic'
    });
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
        kpi_logic: 'CORRECTED - Success Rate = Meetings Booked / (Pending + Scheduled + Pending Recall) × 100',
        services: {
            server: 'running',
            googleSheets: authConfigured ? 'configured' : 'not_configured',
            csvFile: fs.existsSync(path.join(__dirname, 'data', 'contacts.csv')) ? 'available' : 'not_found'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 AI Cold Call Dashboard Server Started - CORRECTED KPI LOGIC');
    console.log('==================================================');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🧪 KPI Test URL: http://localhost:${PORT}/api/test-kpis`);
    console.log(`🔗 Webhook URL: ${process.env.N8N_WEBHOOK_URL || 'Not configured'}`);
    console.log(`📊 Google Sheets ID: ${SHEET_ID}`);
    console.log(`📊 Google Sheets Range: ${RANGE}`);
    console.log(`📊 Authentication: ${authConfigured ? 'Configured' : 'Public access only'}`);
    console.log(`📄 CSV File: ${fs.existsSync(path.join(__dirname, 'data', 'contacts.csv')) ? 'Available' : 'Not found'}`);
    console.log('📝 API Endpoints:');
    console.log('   GET  /api/stats - Real-time KPI data with CORRECTED logic');
    console.log('   GET  /api/test-kpis - Test KPI calculation with controlled dataset');
    console.log('   POST /api/trigger-workflow - Start AI calling campaign');
    console.log('   GET  /api/health - System health check');
    console.log('==================================================');
    console.log('🧮 KPI CALCULATION LOGIC (CORRECTED):');
    console.log('   • Success Rate = Meetings Booked / (Pending + Scheduled + Pending Recall) × 100');
    console.log('   • Denominator excludes Meetings Booked');
    console.log('   • Case-insensitive status matching with whitespace trimming');
    console.log('   • Division by zero protection');
    console.log('   • Results rounded to 2 decimal places');
    console.log('==================================================');
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    
    if (!authConfigured && SHEET_ID === 'YOUR_SHEET_ID_FROM_URL_HERE') {
        console.log('⚠️  CSV MODE: Configure Google Sheets in .env or edit data/contacts.csv for real-time updates');
    } else if (!authConfigured) {
        console.log('⚠️  WARNING: No Google Sheets authentication configured');
        console.log('   Add GOOGLE_API_KEY or GOOGLE_SERVICE_ACCOUNT_KEY to .env for full access');
    }
});
