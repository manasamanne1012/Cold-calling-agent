const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Starting AI Cold Call Agent Server - PROPER KPI Logic...');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Environment configuration
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || 'YOUR_SHEET_ID_FROM_URL_HERE';
const SHEETS_RANGE = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:Z';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://pranay-283.app.n8n.cloud/webhook/d2b3ba76-f9f1-45f8-a7d2-20ecd4906fdd';

// Google Sheets authentication setup
let auth = null;
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
    } else {
        console.log('⚠️  Attempting public Google Sheets access (no authentication)');
    }
} catch (error) {
    console.log('⚠️  Google Sheets authentication failed, will use CSV fallback');
}

/**
 * Normalize call status for consistent matching
 */
function normalizeCallStatus(status) {
    if (!status || typeof status !== 'string') return '';
    
    const normalized = status.trim().toLowerCase();
    
    // Map variations to standard statuses
    const statusMap = {
        'meeting booked': 'Meeting Booked',
        'meetingbooked': 'Meeting Booked',
        'booked': 'Meeting Booked',
        'scheduled': 'Scheduled',
        'pending': 'Pending',
        'pending recall': 'Pending Recall',
        'pendingrecall': 'Pending Recall',
        'recall': 'Pending Recall'
    };
    
    return statusMap[normalized] || status.trim();
}

/**
 * Calculate KPIs with PROPER business logic
 * Success Rate = (Meeting Booked / Total Records) × 100
 */
function calculateKPIs(data) {
    console.log('🧮 Starting KPI calculation with PROPER business logic...');
    console.log(`🔍 Analyzing ${data.length} records with PROPER KPI logic...`);
    
    const kpis = {
        meetings_booked: 0,
        pending: 0,
        scheduled: 0,
        pending_recall: 0,
        success_rate_pct: 0
    };
    
    const statusBreakdown = {};
    const unrecognizedStatuses = [];
    
    // Process each record
    data.forEach((record, index) => {
        const rawStatus = record.callstatus || record.CallStatus || record.status || '';
        const normalizedStatus = normalizeCallStatus(rawStatus);
        
        console.log(`📊 Record ${index + 1}: Raw="${rawStatus}" → Normalized="${normalizedStatus}"`);
        
        // Count status occurrences
        statusBreakdown[normalizedStatus] = (statusBreakdown[normalizedStatus] || 0) + 1;
        
        // Map to KPI categories
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
                if (rawStatus && !unrecognizedStatuses.includes(rawStatus)) {
                    unrecognizedStatuses.push(rawStatus);
                }
        }
    });
    
    // Calculate Success Rate: (Meeting Booked / Total Records) × 100
    const totalRecords = data.length;
    if (totalRecords > 0) {
        kpis.success_rate_pct = parseFloat(((kpis.meetings_booked / totalRecords) * 100).toFixed(2));
    } else {
        kpis.success_rate_pct = 0;
    }
    
    console.log('📈 PROPER KPI CALCULATION RESULTS:');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total Records: ${totalRecords}`);
    console.log(`📊 Status Breakdown:`, statusBreakdown);
    console.log(`📊 Unrecognized Statuses:`, unrecognizedStatuses);
    console.log(`📊 KPI Counts:`);
    console.log(`   • Meetings Booked: ${kpis.meetings_booked}`);
    console.log(`   • Pending: ${kpis.pending}`);
    console.log(`   • Scheduled: ${kpis.scheduled}`);
    console.log(`   • Pending Recall: ${kpis.pending_recall}`);
    console.log(`📊 Success Rate Calculation:`);
    console.log(`   • Formula: Meeting Booked / Total Records × 100`);
    console.log(`   • Calculation: ${kpis.meetings_booked} / ${totalRecords} × 100`);
    console.log(`   • Result: ${kpis.success_rate_pct}%`);
    console.log('═══════════════════════════════════════');
    
    return kpis;
}

/**
 * Fetch data from Google Sheets
 */
async function fetchFromGoogleSheets() {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: SHEETS_RANGE,
        });
        
        const values = response.data.values;
        if (!values || values.length === 0) {
            throw new Error('No data found in Google Sheets');
        }
        
        const headers = values[0].map(h => h.toLowerCase());
        const data = values.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
        
        console.log(`📊 Successfully fetched ${data.length} records from Google Sheets`);
        return data;
    } catch (error) {
        console.log(`❌ Google Sheets error: ${error.message}`);
        throw error;
    }
}

/**
 * Fetch data from CSV file
 */
async function fetchFromCSV() {
    try {
        const csvPath = path.join(__dirname, 'data', 'contacts.csv');
        console.log(`📄 Reading CSV data from: ${csvPath}`);
        
        if (!fs.existsSync(csvPath)) {
            throw new Error(`CSV file not found: ${csvPath}`);
        }
        
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.trim().split('\n');
        
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        console.log(`📄 CSV headers:`, headers);
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const obj = {};
            
            headers.forEach((header, index) => {
                obj[header.toLowerCase()] = values[index] || '';
            });
            
            if (obj.name || obj.callstatus) { // Only include non-empty rows
                data.push(obj);
                console.log(`📄 CSV Row ${i}: {`);
                console.log(`  name: '${obj.name}',`);
                console.log(`  industry: '${obj.industry}',`);
                console.log(`  address: '${obj.address}',`);
                console.log(`  callstatus: '${obj.callstatus}',`);
                console.log(`  companyinfo: '${obj.companyinfo?.substring(0, 80)}${obj.companyinfo?.length > 80 ? '...' : ''}'`);
                console.log(`}`);
            }
        }
        
        console.log(`📄 Successfully processed ${data.length} CSV records`);
        return data;
    } catch (error) {
        console.log(`❌ CSV error: ${error.message}`);
        throw error;
    }
}

/**
 * Fetch lead data with fallback mechanism
 */
async function fetchLeadData() {
    console.log('📊 Stats request - fetching real-time data with PROPER KPI logic...');
    
    // Try Google Sheets first, then CSV fallback
    try {
        if (auth && SHEETS_ID !== 'YOUR_SHEET_ID_FROM_URL_HERE') {
            console.log('📊 Attempting Google Sheets...');
            const data = await fetchFromGoogleSheets();
            console.log('✅ Using Google Sheets data');
            return { data, source: 'google_sheets' };
        } else {
            throw new Error('Google Sheets not configured');
        }
    } catch (sheetsError) {
        console.log('📄 Attempting CSV file...');
        try {
            const data = await fetchFromCSV();
            console.log('✅ Using CSV file data');
            return { data, source: 'csv_file' };
        } catch (csvError) {
            console.log('❌ Both Google Sheets and CSV failed');
            throw new Error(`Data fetch failed: Sheets: ${sheetsError.message}, CSV: ${csvError.message}`);
        }
    }
}

// API Routes

/**
 * GET /api/stats - Get real-time KPI statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const { data, source } = await fetchLeadData();
        const kpis = calculateKPIs(data);
        
        console.log('📊 Final PROPER KPIs:', kpis);
        console.log('📊 Data source:', source);
        
        res.json({
            success: true,
            data: kpis,
            source: source,
            timestamp: new Date().toISOString(),
            total_records: data.length
        });
    } catch (error) {
        console.error('❌ Stats error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            data: {
                meetings_booked: 0,
                pending: 0,
                scheduled: 0,
                pending_recall: 0,
                success_rate_pct: 0
            },
            source: 'error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/test-kpis - Test KPI calculation with controlled dataset
 */
app.get('/api/test-kpis', (req, res) => {
    console.log('🧪 Testing KPI calculation with controlled dataset...');
    
    const testData = [
        { name: 'Test 1', callstatus: 'Meeting Booked' },
        { name: 'Test 2', callstatus: 'Meeting Booked' },
        { name: 'Test 3', callstatus: 'Pending' },
        { name: 'Test 4', callstatus: 'Scheduled' },
        { name: 'Test 5', callstatus: 'Pending Recall' },
        { name: 'Test 6', callstatus: 'Meeting Booked' }
    ];
    
    const kpis = calculateKPIs(testData);
    
    // Expected: 3 meetings booked out of 6 total = 50% success rate
    const expected = {
        meetings_booked: 3,
        pending: 1,
        scheduled: 1,
        pending_recall: 1,
        success_rate_pct: 50.00
    };
    
    console.log('🧪 Test Results:');
    console.log('Expected:', expected);
    console.log('Actual:  ', kpis);
    
    const isCorrect = JSON.stringify(kpis) === JSON.stringify(expected);
    
    res.json({
        success: true,
        test_passed: isCorrect,
        expected: expected,
        actual: kpis,
        message: isCorrect ? 'KPI calculation is correct!' : 'KPI calculation has issues!',
        test_data_count: testData.length
    });
});

/**
 * POST /api/trigger-workflow - Trigger n8n workflow
 */
app.post('/api/trigger-workflow', async (req, res) => {
    try {
        console.log('🚀 Triggering n8n workflow...');
        
        const response = await axios.post(N8N_WEBHOOK_URL, {
            trigger: 'manual',
            timestamp: new Date().toISOString(),
            source: 'dashboard'
        });
        
        console.log('✅ Workflow triggered successfully');
        res.json({
            success: true,
            message: 'AI Cold Call workflow triggered successfully!',
            workflow_response: response.data
        });
    } catch (error) {
        console.error('❌ Workflow trigger error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger workflow: ' + error.message
        });
    }
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'AI Cold Call Agent - PROPER KPI Logic'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 AI Cold Call Dashboard Server Started - PROPER KPI LOGIC');
    console.log('==================================================');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🧪 KPI Test URL: http://localhost:${PORT}/api/test-kpis`);
    console.log(`🔗 Webhook URL: ${N8N_WEBHOOK_URL}`);
    console.log(`📊 Google Sheets ID: ${SHEETS_ID}`);
    console.log(`📊 Google Sheets Range: ${SHEETS_RANGE}`);
    console.log(`📊 Authentication: ${auth ? 'Configured' : 'Public access only'}`);
    console.log(`📄 CSV File: Available`);
    console.log('📝 API Endpoints:');
    console.log('   GET  /api/stats - Real-time KPI data with PROPER logic');
    console.log('   GET  /api/test-kpis - Test KPI calculation with controlled dataset');
    console.log('   POST /api/trigger-workflow - Start AI calling campaign');
    console.log('   GET  /api/health - System health check');
    console.log('==================================================');
    console.log('🧮 KPI CALCULATION LOGIC (PROPER):');
    console.log('   • Success Rate = Meeting Booked / Total Records × 100');
    console.log('   • Standard business success rate calculation');
    console.log('   • Case-insensitive status matching with whitespace trimming');
    console.log('   • Division by zero protection');
    console.log('   • Results rounded to 2 decimal places');
    console.log('==================================================');
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log(`⚠️  CSV MODE: Configure Google Sheets in .env or edit data/contacts.csv for real-time updates`);
});
