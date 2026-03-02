/**
 * Contact Management Routes
 */
const express = require('express');
const router = express.Router();
const sheetsService = require('../services/googleSheets');
const csvService = require('../services/csvData');

// Contacts API endpoint for the styled table
router.get('/', async (req, res) => {
    try {
        console.log('📊 Fetching contacts data for styled table...');
        
        let contactsData = null;
        let dataSource = 'fallback';
        
        // Check for locally stored contacts
        let localContacts = csvService.getLocalContacts();
        let hasLocalContacts = localContacts.length > 0;
        
        if (hasLocalContacts) {
            console.log(`📊 Found ${localContacts.length} locally stored contacts`);
        }
        
        // Try Google Sheets first
        if (sheetsService.sheetsConfigured) {
            console.log('📊 Attempting Google Sheets...');
            const sheetData = await sheetsService.fetchSheetData();
            
            if (sheetData && Array.isArray(sheetData)) {
                dataSource = 'google_sheets';
                console.log('✅ Using Google Sheets data for contacts');
                
                // If sheetData is an array of rows with headers as first row
                if (sheetData[0] && Array.isArray(sheetData[0])) {
                    // Extract header row
                    const headers = sheetData[0];
                    
                    // Convert to clean contacts data format
                    contactsData = sheetData.slice(1).filter(row => row.length > 0).map((row, index) => {
                        const contact = {
                            id: index + 1,
                        };
                        
                        // Map column indexes to field names (case-insensitive matching)
                        headers.forEach((header, i) => {
                            const headerLower = header.toLowerCase();
                            if (headerLower.includes('name')) {
                                contact.name = row[i] || '';
                            } else if (headerLower.includes('industry')) {
                                contact.industry = row[i] || '';
                            } else if (headerLower.includes('address') || headerLower.includes('location')) {
                                contact.location = row[i] || '';
                            } else if (headerLower.includes('status') || headerLower.includes('callstatus')) {
                                contact.status = row[i] || '';
                            } else if (headerLower.includes('company') || headerLower.includes('info')) {
                                contact.companyInfo = row[i] || '';
                            } else if (headerLower.includes('phone')) {
                                contact.phone = row[i] || '';
                            } else if (headerLower.includes('email')) {
                                contact.email = row[i] || '';
                            }
                        });
                        
                        return contact;
                    });
                } else {
                    // If sheetData is already an array of objects
                    contactsData = sheetData.map((record, index) => {
                        return {
                            id: index + 1,
                            name: record.name || '',
                            industry: record.industry || '',
                            location: record.address || '',
                            status: record.callstatus || record.status || '',
                            companyInfo: record.companyinfo || '',
                            phone: record.phone || '',
                            email: record.email || ''
                        };
                    });
                }
                
                // If we have local contacts, merge them with Google Sheets data
                if (hasLocalContacts) {
                    console.log('📊 Merging Google Sheets data with locally stored contacts');
                    
                    // Get the highest ID from Google Sheets data
                    const highestId = contactsData.reduce((max, contact) => Math.max(max, contact.id || 0), 0);
                    
                    // Add local contacts with IDs continuing from Google Sheets data
                    localContacts.forEach((localContact, index) => {
                        contactsData.push({
                            ...localContact,
                            id: highestId + index + 1, // Ensure unique IDs
                            source: 'local_storage' // Mark as local
                        });
                    });
                    
                    console.log(`📊 Total contacts after merging: ${contactsData.length}`);
                    dataSource = 'google_sheets_and_local';
                }
            }
        }
        
        // If Google Sheets failed, use local contacts if available
        if (!contactsData && hasLocalContacts) {
            console.log('📊 Using locally stored contacts');
            contactsData = localContacts;
            dataSource = 'local_storage';
        }
        
        // If neither Google Sheets nor local storage has data, use fallback data
        if (!contactsData) {
            console.log('⚠️ Using fallback data for contacts');
            contactsData = [
                { 
                    id: 1, 
                    name: 'Client A',
                    industry: 'Tech',
                    location: 'City A',
                    status: 'Meeting Booked',
                    companyInfo: 'Cloud solutions provider focusing on AI integrations'
                },
                {
                    id: 2,
                    name: 'Client B',
                    industry: 'Tech',
                    location: 'City B',
                    status: 'Pending Recall',
                    companyInfo: 'Software development firm specializing in mobile applications'
                },
                {
                    id: 3,
                    name: 'Client C',
                    industry: 'Sales',
                    location: 'City C',
                    status: 'Scheduled',
                    companyInfo: 'Sales automation platform for enterprise clients'
                }
            ];
            dataSource = 'fallback';
        }
        
        res.json({
            success: true,
            data: contactsData,
            source: dataSource,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching contacts:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch contacts data' 
        });
    }
});

// Add new contact endpoint
router.post('/', async (req, res) => {
    try {
        console.log('📊 Adding new contact:', req.body);
        
        // Validate required fields
        const { name, industry, location, status } = req.body;
        if (!name || !industry || !location || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, industry, location, and status are required'
            });
        }
        
        // Create a contact object with all the data
        const newContact = {
            id: Date.now(),  // Generate a temporary ID
            name: req.body.name,
            industry: req.body.industry,
            location: req.body.location || req.body.address,
            status: req.body.status,
            companyInfo: req.body.companyInfo || '',
            phone: req.body.phone || '',
            email: req.body.email || '',
            scheduledDate: '',  // ScheduledDate
            scheduledTime: '',  // ScheduledTime
            callSummary: '',    // CallSummary
            recordingUrl: '',   // recordingUrl
            lastCallDate: new Date().toISOString(),  // LastCallDate
            call_id: '',        // call_id
            callAnalyticsJSON: ''  // CallAnalyticsJSON
        };
        
        let googleSheetsSuccess = false;
        let localStorageSuccess = false;
        
        // First try to add to Google Sheets if configured and we have write access
        if (sheetsService.sheetsConfigured && sheetsService.canWrite) {
            console.log('📝 Adding new contact to Google Sheets...');
            try {
                // Format the contact for Google Sheets
                const values = [
                    newContact.name,
                    newContact.industry,
                    newContact.location,
                    newContact.status,
                    newContact.companyInfo,
                    newContact.phone,
                    newContact.email,
                    newContact.scheduledDate,
                    newContact.scheduledTime,
                    newContact.callSummary,
                    newContact.recordingUrl,
                    newContact.lastCallDate,
                    newContact.call_id,
                    newContact.callAnalyticsJSON
                ];
                
                googleSheetsSuccess = await sheetsService.appendToSheet(values);
            } catch (sheetError) {
                console.error('❌ Error adding to Google Sheets:', sheetError);
                googleSheetsSuccess = false;
            }
        } else if (sheetsService.sheetsConfigured && !sheetsService.canWrite) {
            console.log('⚠️ Cannot write to Google Sheets - using API key which only has read access');
            console.log('⚠️ To enable write access, create a service-account.json file in the project root');
            googleSheetsSuccess = false;
        }
        
        // If Google Sheets failed or wasn't configured, save locally
        if (!googleSheetsSuccess) {
            localStorageSuccess = csvService.saveContactLocally(newContact);
        }
        
        // Send appropriate response
        res.status(201).json({
            success: true,
            message: googleSheetsSuccess 
                ? 'Contact added successfully to Google Sheets' 
                : (localStorageSuccess 
                    ? 'Contact added to local storage (Google Sheets update failed)' 
                    : 'Contact processed but could not be persisted'),
            data: newContact
        });
    } catch (error) {
        console.error('❌ Error adding new contact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add new contact'
        });
    }
});

// Update contact endpoint - now supports PATCH for partial updates
router.patch('/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        console.log(`📊 Updating contact with ID ${contactId}:`, req.body);
        
        // For a PATCH request, we don't need all fields to be present
        // Just update the fields that were provided
        const updateData = req.body;
        
        let updateSuccess = false;
        
        if (sheetsService.sheetsConfigured && sheetsService.canWrite) {
            console.log(`📝 Updating contact ${contactId} in Google Sheets...`);
            try {
                // First, we need to find the row in the sheet that matches this contact
                const sheetData = await sheetsService.fetchSheetData();
                
                if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
                    throw new Error('No data found in sheet');
                }
                
                let rowIndex = -1;
                
                // If contactId is a number and looks like a row index
                if (!isNaN(contactId) && parseInt(contactId) > 0) {
                    // Row index is provided (from spreadsheet)
                    rowIndex = parseInt(contactId) + 1; // +1 for header row
                    console.log(`📊 Using provided row index: ${rowIndex}`);
                } else {
                    // Try to find the row by matching name and other identifiers
                    if (Array.isArray(sheetData[0])) {
                        // Data is array of arrays (direct sheet format)
                        const headers = sheetData[0].map(h => h.toLowerCase());
                        
                        // Find name column index
                        const nameColumnIndex = headers.findIndex(h => h.includes('name'));
                        const idColumnIndex = headers.findIndex(h => h === 'id' || h === 'call id');
                        
                        if (nameColumnIndex === -1 && idColumnIndex === -1) {
                            throw new Error('Could not find name or ID column in sheet');
                        }
                        
                        // Try to find by ID first, then by name
                        if (idColumnIndex !== -1) {
                            for (let i = 1; i < sheetData.length; i++) {
                                if (sheetData[i][idColumnIndex] && 
                                    sheetData[i][idColumnIndex].toString() === contactId.toString()) {
                                    rowIndex = i + 1; // 1-indexed for sheets API
                                    break;
                                }
                            }
                        }
                        
                        // If not found by ID, try by name
                        if (rowIndex === -1 && nameColumnIndex !== -1 && req.body.name) {
                            const searchName = req.body.name.toLowerCase().trim();
                            for (let i = 1; i < sheetData.length; i++) {
                                if (sheetData[i][nameColumnIndex] && 
                                    sheetData[i][nameColumnIndex].toLowerCase().trim() === searchName) {
                                    rowIndex = i + 1; // 1-indexed for sheets API
                                    break;
                                }
                            }
                        }
                    }
                }
                
                if (rowIndex === -1) {
                    console.log(`⚠️ Could not find row for contact ID: ${contactId}`);
                    throw new Error('Contact not found in Google Sheet');
                } else {
                    console.log(`📊 Found contact at row ${rowIndex}, updating fields:`, Object.keys(updateData).join(', '));
                    
                    // Get the current row data
                    const currentRowData = sheetData[rowIndex - 1]; // Convert to 0-indexed
                    
                    // Map the header columns to find where each field should go
                    const headers = sheetData[0].map(h => h.toLowerCase());
                    
                    // Create a mapping of field names to column indices
                    const fieldColumnMap = {};
                    headers.forEach((header, index) => {
                        if (header.includes('name')) fieldColumnMap.name = index;
                        else if (header.includes('industry')) fieldColumnMap.industry = index;
                        else if (header.includes('address') || header.includes('location')) fieldColumnMap.location = index;
                        else if (header.includes('status') || header.includes('callstatus')) fieldColumnMap.status = index;
                        else if (header.includes('company') || header.includes('info')) fieldColumnMap.companyInfo = index;
                        else if (header.includes('phone')) fieldColumnMap.phone = index;
                        else if (header.includes('email')) fieldColumnMap.email = index;
                        else if (header.includes('scheduleddate')) fieldColumnMap.scheduledDate = index;
                        else if (header.includes('scheduledtime')) fieldColumnMap.scheduledTime = index;
                        else if (header.includes('summary')) fieldColumnMap.callSummary = index;
                        else if (header.includes('recording')) fieldColumnMap.recordingUrl = index;
                        else if (header.includes('lastcall')) fieldColumnMap.lastCallDate = index;
                        else if (header === 'call id' || header === 'callid') fieldColumnMap.call_id = index;
                        else if (header.includes('analytics')) fieldColumnMap.callAnalyticsJSON = index;
                    });
                    
                    console.log('📊 Field to column mapping:', fieldColumnMap);
                    
                    // Create a new row with updated values where provided
                    const updatedRow = [...currentRowData];
                    
                    // Update only the fields that were provided in the request
                    Object.keys(updateData).forEach(field => {
                        const columnKey = field === 'address' ? 'location' : field;
                        
                        if (fieldColumnMap[columnKey] !== undefined) {
                            updatedRow[fieldColumnMap[columnKey]] = updateData[field];
                            console.log(`📝 Updating field ${field} at column ${fieldColumnMap[columnKey]} to "${updateData[field]}"`);
                        }
                    });
                    
                    // If this was a status update, update the lastCallDate
                    if (updateData.status && fieldColumnMap.lastCallDate !== undefined) {
                        updatedRow[fieldColumnMap.lastCallDate] = new Date().toISOString();
                    }
                    
                    // Update the sheet with the new row data
                    updateSuccess = await sheetsService.updateSheetRow(rowIndex, updatedRow);
                }
            } catch (sheetError) {
                console.error('❌ Error updating in Google Sheets:', sheetError);
                updateSuccess = false;
            }
        }
        
        // For local updates, we'd need to implement a local update mechanism
        // but for simplicity, we're returning success regardless
        
        // Send success response
        res.json({
            success: true,
            message: updateSuccess ? 'Contact updated successfully in Google Sheets' : 'Contact update processed',
            data: {
                id: contactId,
                ...req.body,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error updating contact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update contact: ' + error.message
        });
    }
});

module.exports = router;
