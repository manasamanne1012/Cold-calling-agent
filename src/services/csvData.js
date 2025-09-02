/**
 * CSV Data Service
 * Handles interactions with local CSV files
 */
const fs = require('fs');
const path = require('path');

/**
 * Read data from local CSV file
 * @param {string} fileName - Name of the CSV file (in data directory)
 * @returns {Array|null} Parsed CSV data as array of objects, or null if failed
 */
function fetchCSVData(fileName = 'contacts.csv') {
    try {
        const csvPath = path.join(__dirname, '..', '..', 'data', fileName);
        
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

        // Parse CSV headers
        const headers = lines[0].split(',').map(h => h.trim());
        console.log('📄 CSV headers:', headers);

        // Parse CSV data
        const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const record = {};
            
            headers.forEach((header, colIndex) => {
                const cleanHeader = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                record[cleanHeader] = values[colIndex] || '';
            });

            // Log first few records for debugging
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

/**
 * Save contacts data to local JSON file
 * @param {Object} contact - Contact data to save
 * @returns {boolean} Success status
 */
function saveContactLocally(contact) {
    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Save to a local JSON file as fallback
        const localFilePath = path.join(dataDir, 'contacts-local.json');
        let existingContacts = [];
        
        // Read existing file if it exists
        if (fs.existsSync(localFilePath)) {
            try {
                const fileContent = fs.readFileSync(localFilePath, 'utf8');
                existingContacts = JSON.parse(fileContent);
            } catch (readError) {
                console.error('❌ Error reading local contacts file:', readError);
                existingContacts = [];
            }
        }
        
        // Add the new contact
        existingContacts.push(contact);
        
        // Write back to file
        fs.writeFileSync(localFilePath, JSON.stringify(existingContacts, null, 2), 'utf8');
        console.log('📝 Contact saved to local file:', localFilePath);
        return true;
    } catch (error) {
        console.error('❌ Error saving contact locally:', error);
        return false;
    }
}

/**
 * Read contacts from local JSON file
 * @returns {Array} Contacts from local storage
 */
function getLocalContacts() {
    try {
        const localFilePath = path.join(__dirname, '..', '..', 'data', 'contacts-local.json');
        
        if (!fs.existsSync(localFilePath)) {
            return [];
        }
        
        const fileContent = fs.readFileSync(localFilePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('❌ Error reading local contacts:', error);
        return [];
    }
}

module.exports = {
    fetchCSVData,
    saveContactLocally,
    getLocalContacts
};
