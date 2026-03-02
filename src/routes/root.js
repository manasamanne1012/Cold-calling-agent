// This file ensures the direct-contacts-sheet.html is served as the root page
const express = require('express');
const router = express.Router();
const path = require('path');

// Explicitly serve direct-contacts-sheet.html for root route
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  console.log('Serving direct-contacts-sheet.html at root route (/)');
  
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'direct-contacts-sheet.html'));
});

// Redirect /index.html to root
router.get('/index.html', (req, res) => {
  console.log('Redirecting /index.html to root (/)');
  res.redirect('/');
});

module.exports = router;
