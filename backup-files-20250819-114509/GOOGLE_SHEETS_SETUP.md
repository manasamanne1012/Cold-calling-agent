# 🔧 Google Sheets Real-Time Setup Guide

## Problem: KPIs Not Updating When You Change Google Sheet Values

**Why it's happening**: The dashboard can't access your Google Sheet because authentication isn't configured.

## ⚡ Quick Fix (2 Minutes Setup)

### Step 1: Get Your Google Sheet ID
1. Open your Google Sheet in browser
2. Copy the URL (looks like): `https://docs.google.com/spreadsheets/d/1abc123DEF456/edit`
3. Your Sheet ID is the part between `/d/` and `/edit`: `1abc123DEF456`

### Step 2: Make Your Sheet Public (Easiest Option)
1. In your Google Sheet, click **"Share"** button (top right)
2. Click **"Change to anyone with the link"**
3. Set permission to **"Viewer"** 
4. Click **"Done"**

### Step 3: Update Configuration
1. Open `.env` file in your project
2. Replace `YOUR_SHEET_ID_FROM_URL_HERE` with your actual Sheet ID:
   ```
   GOOGLE_SHEET_ID=1abc123DEF456
   ```
3. Save the file

### Step 4: Restart Server
```bash
# Stop server (Ctrl+C in terminal)
# Start server again
node server.js
```

## ✅ Test Real-Time Updates

1. Open dashboard: http://localhost:3000
2. Open your Google Sheet in another browser tab
3. Change a "Call Status" value (e.g., change "Pending" to "Meeting Booked")
4. Wait 30 seconds or click "Refresh Data" button
5. **KPIs should update automatically!**

## 🛡️ Secure Setup (Optional)

If you don't want to make your sheet public:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google Sheets API"
4. Create API Key in "Credentials"
5. Add to `.env` file:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

## 📊 Sheet Format Requirements

Your Google Sheet should have these columns:
- **Column D**: `CallStatus` (or similar)
- **Values**: Exactly match these names:
  - `Meeting Booked`
  - `Pending`
  - `Scheduled` 
  - `Pending Recall`

## 🔍 Troubleshooting

**Still showing fallback data?**
1. Check server logs for error messages
2. Verify Sheet ID is correct
3. Ensure sheet is publicly viewable
4. Restart the server after changes

**KPIs showing 0s?**
1. Check column names in your sheet
2. Verify "CallStatus" column exists
3. Ensure status values match exactly (case-sensitive)

## 🎯 Expected Result

After setup, when you change Call Status values in Google Sheets:
- **Real-time updates** every 30 seconds
- **Manual refresh** with "Refresh Data" button  
- **Live data indicator** shows "Live" instead of "Demo"
- **KPIs automatically recalculate** based on your actual data

## ❓ Need Help?

Check the server terminal for detailed logs about what's happening with your Google Sheets connection.
