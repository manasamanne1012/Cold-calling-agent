/**
 * Google Sheets Service
 * Handles all interactions with Google Sheets API
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Google Sheets Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || 'YOUR_GOOGLE_SHEET_ID';
const RANGE = process.env.GOOGLE_SHEET_RANGE || "'AI Cold Call'!A:Z";

// Google Sheets Authentication
let sheets;
let authConfigured = false;
let canWriteToSheets = false;

/**
 * Initialize Google Sheets API connection
 */
function initGoogleSheets() {
    try {
        // Check for service account credentials file first
        const serviceAccountPath = path.join(__dirname, '..', '..', 'service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            // Read service account from file
            try {
                console.log('🔑 Found service account credentials file');
                const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Full access for read/write
                });
                sheets = google.sheets({ version: 'v4', auth });
                authConfigured = true;
                canWriteToSheets = true;
                console.log('✅ Google Sheets authenticated with service account (with write access)');
            } catch (serviceAccountError) {
                console.error('❌ Error using service account file:', serviceAccountError.message);
            }
        } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            // Production: Use service account from environment variable
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Full access for read/write
            });
            sheets = google.sheets({ version: 'v4', auth });
            authConfigured = true;
            canWriteToSheets = true;
            console.log('✅ Google Sheets authenticated with service account (with write access)');
        } else if (process.env.GOOGLE_API_KEY) {
            // Development: Use API key (read-only)
            // For client OAuth IDs (starting with GOCSPX-), we need to use them differently
            if (process.env.GOOGLE_API_KEY.startsWith('GOCSPX-')) {
                console.log('⚠️ Detected OAuth Client ID instead of API Key - using alternative method');
                // We need to use a special approach for OAuth tokens
                console.log('📊 Will try direct CSV export approach instead');
                authConfigured = false;
                canWriteToSheets = false;
            } else {
                sheets = google.sheets({ 
                    version: 'v4', 
                    auth: process.env.GOOGLE_API_KEY 
                });
                authConfigured = true;
                canWriteToSheets = false;
                console.log('✅ Google Sheets authenticated with API key (read-only access)');
            }
        } else {
            // Try public access (no authentication required)
            sheets = google.sheets({ version: 'v4' });
            authConfigured = false;
            canWriteToSheets = false;
            console.log('⚠️  Attempting public Google Sheets access (no authentication)');
        }
    } catch (error) {
        console.error('❌ Google Sheets authentication failed:', error.message);
        console.log('📝 Will use mock data for KPIs');
    }
}

/**
 * Fetch data from Google Sheets
 * @returns {Promise<Array|null>} Rows from the sheet, or null if failed
 */
async function fetchSheetData() {
    try {
        // Try direct CSV export method first (works with publicly shared sheets)
        try {
            const csvExportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
            
            console.log(`📊 Attempting direct CSV export from Google Sheet: ${SHEET_ID}`);
            console.log(`📊 Using CSV export URL: ${csvExportUrl}`);
            
            // Try to fetch as a publicly accessible CSV
            const response = await axios.get(csvExportUrl, {
                responseType: 'text',
                headers: { 'User-Agent': 'AI-Cold-Call-Dashboard/1.0' },
                timeout: 5000,
                validateStatus: (status) => status === 200
            }).catch(err => {
                console.log(`❌ CSV export request failed: ${err.message}`);
                return null;
            });
            
            if (response && response.data) {
                console.log('✅ Successfully fetched Google Sheet as CSV');
                
                // Parse CSV data
                const lines = response.data.trim().split('\n');
                if (lines.length < 2) {
                    throw new Error('CSV data has insufficient rows');
                }
                
                const headers = lines[0].split(',').map(h => h.trim());
                console.log('📊 CSV headers:', headers);
                
                // Convert CSV to rows format expected by the rest of the code
                const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
                
                console.log(`📊 Processed ${rows.length} rows from Google Sheets CSV export`);
                return rows;
            } else {
                throw new Error('Invalid response from CSV export');
            }
        } catch (csvError) {
            console.log(`❌ CSV direct export failed: ${csvError.message}`);
            console.log('⚠️ Falling back to Google Sheets API...');
        }
        
        // Original Google Sheets API method as fallback
        if (!sheets) {
            throw new Error('Google Sheets API not initialized');
        }

        console.log(`📊 Fetching data from Sheet ID via API: ${SHEET_ID}`);
        console.log(`📊 Range: ${RANGE}`);
        
        const request = {
            spreadsheetId: SHEET_ID,
            range: RANGE,
        };

        // Add API key if available and no other auth is configured
        if (!authConfigured && process.env.GOOGLE_API_KEY) {
            console.log(`🔑 Adding API key to request: ${process.env.GOOGLE_API_KEY.substring(0, 5)}...${process.env.GOOGLE_API_KEY.substring(process.env.GOOGLE_API_KEY.length - 5)}`);
            request.key = process.env.GOOGLE_API_KEY;
        }

        console.log(`📤 Sending Google Sheets API request: ${JSON.stringify(request, (key, value) => key === 'key' ? '***REDACTED***' : value)}`);
        const response = await sheets.spreadsheets.values.get(request);

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('📊 No data found in Google Sheets');
            return null;
        }

        console.log(`📊 Found ${rows.length} rows in Google Sheets`);
        
        // Log the headers to understand the structure
        const headers = rows[0];
        console.log('📊 Sheet headers:', headers);

        return rows;
    } catch (error) {
        console.error('❌ Error fetching Google Sheets data:', error.message);
        
        // Log more specific error information
        if (error.code === 403) {
            console.error('❌ Permission denied - Check if sheet is publicly viewable or API key is valid');
        } else if (error.code === 404) {
            console.error('❌ Sheet not found - Check GOOGLE_SHEET_ID in .env file');
        } else if (error.code === 400) {
            console.error('❌ Bad request - Check GOOGLE_SHEET_RANGE format');
        }
        
        return null;
    }
}

/**
 * Add a new row to Google Sheets
 * @param {Array} values - Values to add as a row
 * @returns {Promise<boolean>} Success status
 */
async function appendToSheet(values) {
    if (!sheets || !canWriteToSheets) {
        console.log('⚠️ Cannot write to Google Sheets - not configured with write access');
        return false;
    }

    try {
        const resource = { values: [values] };
        
        console.log('📊 Attempting to append data to sheet:', SHEET_ID);
        
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: RANGE,
            valueInputOption: 'RAW',
            resource,
        });
        
        console.log('✅ Successfully added new row to Google Sheets:', result.data);
        return true;
    } catch (error) {
        console.error('❌ Error adding to Google Sheets:', error);
        
        // Log detailed error information
        if (error.status === 401) {
            console.log('⚠️ Authentication error: Google Sheets API requires OAuth or Service Account credentials with write permissions');
            console.log('⚠️ API Key authentication only allows read access, not write access');
        }
        
        return false;
    }
}

/**
 * Update a row in Google Sheets
 * @param {number} rowIndex - Index of the row to update (1-based)
 * @param {Array} values - Values to update the row with
 * @returns {Promise<boolean>} Success status
 */
async function updateSheetRow(rowIndex, values) {
    if (!sheets || !canWriteToSheets) {
        console.log('⚠️ Cannot write to Google Sheets - not configured with write access');
        return false;
    }

    try {
        const resource = { values: [values] };
        
        console.log(`📊 Updating row ${rowIndex} in sheet: ${SHEET_ID}`);
        
        const result = await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${RANGE.split('!')[0]}!A${rowIndex}:${String.fromCharCode(65 + values.length - 1)}${rowIndex}`,
            valueInputOption: 'RAW',
            resource,
        });
        
        console.log(`✅ Successfully updated row ${rowIndex} in Google Sheets:`, result.data);
        return true;
    } catch (error) {
        console.error('❌ Error updating row in Google Sheets:', error);
        return false;
    }
}

/**
 * Get authentication information
 * @returns {Object} Authentication information
 */
function getAuthInfo() {
    let authInfo = {
        authType: 'none',
        canWrite: canWriteToSheets,
        serviceAccountEmail: null
    };
    
    try {
        // Check for service account file in the default location
        const serviceAccountPath = path.join(__dirname, '..', '..', 'service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            authInfo.serviceAccountEmail = credentials.client_email;
            authInfo.authType = 'service_account';
        } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            // Get from environment variable
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            authInfo.serviceAccountEmail = credentials.client_email;
            authInfo.authType = 'service_account_env';
        } else if (process.env.GOOGLE_API_KEY) {
            authInfo.authType = 'api_key';
        }
    } catch (error) {
        console.error('Error getting service account info:', error.message);
    }
    
    return authInfo;
}

module.exports = {
    initGoogleSheets,
    fetchSheetData,
    appendToSheet,
    updateSheetRow,
    getAuthInfo,
    get sheetsConfigured() { return !!sheets; },
    get canWrite() { return canWriteToSheets; }
};
