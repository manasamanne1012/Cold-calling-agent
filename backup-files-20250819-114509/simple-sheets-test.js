const axios = require('axios');
require('dotenv').config();

// Get environment variables
const API_KEY = process.env.GOOGLE_API_KEY;
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1vOfTLk14C0G9Dz1rTTJIpEe1XB9eDRRv65fnYVQrLWw';

// Simple test - just make a direct API call to validate access
async function testSheetAccess() {
    console.log('🔍 Testing Google Sheets API access');
    console.log(`🔑 API Key: ${API_KEY ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}` : 'Not configured'}`);
    console.log(`📊 Sheet ID: ${SHEET_ID}`);
    
    try {
        // Direct API call with axios - no range, just get spreadsheet info
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
        console.log(`📤 API URL: ${url.replace(API_KEY, '***REDACTED***')}`);
        
        const response = await axios.get(url);
        
        console.log('✅ Successfully accessed spreadsheet!');
        console.log('📑 Spreadsheet title:', response.data.properties.title);
        console.log('📑 Available sheets:');
        
        if (response.data.sheets) {
            response.data.sheets.forEach((sheet, index) => {
                console.log(`   ${index + 1}. ${sheet.properties.title}`);
            });
        }
        
        // Now let's try to get data from the first sheet
        if (response.data.sheets && response.data.sheets.length > 0) {
            const firstSheet = response.data.sheets[0].properties.title;
            console.log(`\n📊 Attempting to read data from sheet: ${firstSheet}`);
            
            // Make a request for the values using the actual sheet name
            const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${firstSheet}?key=${API_KEY}`;
            console.log(`📤 Values API URL: ${valuesUrl.replace(API_KEY, '***REDACTED***')}`);
            
            const valuesResponse = await axios.get(valuesUrl);
            
            if (valuesResponse.data && valuesResponse.data.values) {
                console.log('✅ Successfully read values!');
                console.log(`📊 Total rows: ${valuesResponse.data.values.length}`);
                
                if (valuesResponse.data.values.length > 0) {
                    console.log('📊 Headers:', valuesResponse.data.values[0]);
                    
                    if (valuesResponse.data.values.length > 1) {
                        console.log('📊 First data row:', valuesResponse.data.values[1]);
                    }
                }
            } else {
                console.log('❌ No values returned in the response');
                console.log('Response:', valuesResponse.data);
            }
        }
        
    } catch (error) {
        console.log('❌ Error accessing Google Sheets API:');
        console.log(`   Status: ${error.response?.status || 'Unknown'}`);
        console.log(`   Message: ${error.message}`);
        
        if (error.response?.data) {
            console.log('Error details:', error.response.data);
        }
    }
}

// Run test
testSheetAccess();
