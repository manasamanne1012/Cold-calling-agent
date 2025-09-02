/**
 * Page Routes for the application
 */
const express = require('express');
const router = express.Router();
const path = require('path');

// Root route - serve main dashboard
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// Direct Google Sheets editor route
router.get('/sheets-editor', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'sheets-editor.html'));
});

// Direct Sheet view without headers
router.get('/direct-sheet', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'direct-sheet.html'));
});

// Embedded Google Sheet with edit access
router.get('/embedded-sheet', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'embedded-sheet.html'));
});

// Service account setup page
router.get('/service-account-setup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'service-account-setup.html'));
});

module.exports = router;
