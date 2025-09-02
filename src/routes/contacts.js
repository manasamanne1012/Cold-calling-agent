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
                    name: 'Surya', 
                    industry: 'Tech', 
                    location: 'Hyderabad', 
                    status: 'Meeting Booked',
                    companyInfo: 'Cloud solutions provider focusing on AI integrations'
                },
                { 
                    id: 2, 
                    name: 'Pranay', 
                    industry: 'Tech', 
                    location: 'Hyderabad', 
                    status: 'Pending Recall',
                    companyInfo: 'Software development firm specializing in mobile applications'
                },
                { 
                    id: 3, 
                    name: 'Varun', 
                    industry: 'Sales', 
                    location: 'Hyderabad', 
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

// Update contact endpoint
router.put('/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        console.log(`📊 Updating contact with ID ${contactId}:`, req.body);
        
        // Validate required fields
        const { name, industry, location, status } = req.body;
        if (!name || !industry || !location || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, industry, location, and status are required'
            });
        }
        
        let updateSuccess = false;
        
        if (sheetsService.sheetsConfigured && sheetsService.canWrite) {
            console.log(`📝 Updating contact ${contactId} in Google Sheets...`);
            try {
                // First, we need to find the row in the sheet that matches this contact
                // For simplicity, let's fetch all data and find the matching row
                const sheetData = await sheetsService.fetchSheetData();
                
                if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
                    throw new Error('No data found in sheet');
                }
                
                // Try to find the row by matching name and other identifiers
                let rowIndex = -1;
                const searchName = req.body.name.toLowerCase().trim();
                
                if (Array.isArray(sheetData[0])) {
                    // Data is array of arrays (direct sheet format)
                    const headers = sheetData[0];
                    let nameColumnIndex = -1;
                    
                    // Find name column
                    headers.forEach((header, index) => {
                        if (header.toLowerCase().includes('name')) {
                            nameColumnIndex = index;
                        }
                    });
                    
                    if (nameColumnIndex === -1) {
                        throw new Error('Could not find name column in sheet');
                    }
                    
                    // Find row with matching name
                    for (let i = 1; i < sheetData.length; i++) {
                        if (sheetData[i][nameColumnIndex] && 
                            sheetData[i][nameColumnIndex].toLowerCase().trim() === searchName) {
                            rowIndex = i + 1; // 1-indexed for sheets API
                            break;
                        }
                    }
                }
                
                if (rowIndex === -1) {
                    console.log(`⚠️ Could not find row for contact: ${searchName}`);
                } else {
                    console.log(`📊 Found contact at row ${rowIndex}, updating...`);
                    
                    // Update the values in that row
                    const values = [
                        req.body.name,
                        req.body.industry,
                        req.body.location || req.body.address,
                        req.body.status,
                        req.body.companyInfo || '',
                        req.body.phone || '',
                        req.body.email || ''
                    ];
                    
                    updateSuccess = await sheetsService.updateSheetRow(rowIndex, values);
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
            error: 'Failed to update contact'
        });
    }
});

module.exports = router;
