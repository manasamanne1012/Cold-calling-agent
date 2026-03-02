# AI Cold Call Website - Server Update Instructions

These instructions guide you through implementing the comprehensive n8n workflow for the AI cold call system.

## Overview of the New Workflow

The workflow you're implementing includes:

1. Making AI cold calls via Vapi.ai
2. Tracking call status in Google Sheets
3. Managing appointment scheduling
4. Sending email confirmations
5. Adding meeting details to Google Calendar

## Instructions

1. SSH into your server first:
   ```
   ssh YOUR_USER@YOUR_SERVER_IP
   ```

2. Go to the applications directory:
   ```
   cd ~/applications/ai-cold-call-website
   ```

3. Update the `.env` file to use the correct webhook path:
   ```
   # First backup the current .env file
   cp .env .env.backup

   # Then edit the file
   nano .env
   ```

   Update the `N8N_WEBHOOK_PATH` variable to:
   ```
   N8N_WEBHOOK_PATH=/webhook/YOUR_WEBHOOK_ID
   ```

4. Copy the updated files to the server:
   - Use SFTP or SCP to upload the following files:
     - src/services/n8nService.js (data formatting)
     - src/services/workflow-trigger.js (authentication)
     - src/routes/api.js (error handling)
     - test-n8n-connection.js (testing utility)

   Using SCP from your local machine:
   ```
   scp ./src/services/n8nService.js YOUR_USER@YOUR_SERVER_IP:~/applications/ai-cold-call-website/src/services/
   scp ./src/services/workflow-trigger.js YOUR_USER@YOUR_SERVER_IP:~/applications/ai-cold-call-website/src/services/
   scp ./src/routes/api.js YOUR_USER@YOUR_SERVER_IP:~/applications/ai-cold-call-website/src/routes/
   scp ./test-n8n-connection.js YOUR_USER@YOUR_SERVER_IP:~/applications/ai-cold-call-website/
   ```

5. Import the n8n workflow:
   - Navigate to http://YOUR_SERVER_IP:8080/ in your browser
   - Log in with username `admin` and password `YOUR_N8N_PASSWORD`
   - Go to Workflows → Import From File
   - Paste the entire workflow JSON (provided separately)
   - Click Import
   - Configure credentials:
     - Google Sheets credentials for spreadsheet ID: YOUR_GOOGLE_SHEET_ID
     - Google Calendar credentials for calendar: YOUR_GOOGLE_CALENDAR_ID@group.calendar.google.com
     - Gmail credentials for sending email confirmations
   - Save and activate the workflow

6. Rebuild and restart the Docker container:
   ```
   # Stop and remove the current container
   sudo docker stop $(sudo docker ps -q --filter "name=ai-cold-call-website")
   sudo docker rm $(sudo docker ps -aq --filter "name=ai-cold-call-website")

   # Rebuild and start the container
   sudo docker-compose down
   sudo docker-compose build
   sudo docker-compose up -d
   ```

7. Test the n8n connection:
   ```
   # Run the test script
   node test-n8n-connection.js
   ```

6. Check the logs for any errors:
   ```
   sudo docker logs $(sudo docker ps -q --filter "name=ai-cold-call-website")
   ```

## Key Code Changes

1. **n8nService.js**:
   - Format changed to match what the new workflow expects (direct data, not wrapped in a `contact` object)
   - Example:
     ```javascript
     // Old format
     const requestData = {
       contact: {
         ...data,
         timestamp: new Date().toISOString(),
         source: 'ai-cold-call-agent',
         triggeredAt: new Date().toISOString()
       }
     };
     
     // New format 
     const requestData = {
       Name: data.name,
       Phone: data.phone,
       email: data.email || '',
       Industry: data.industry || '',
       CompanyInfo: data.company || '',
       CallStatus: data.status || 'Pending',
       source: 'ai-cold-call-agent',
       timestamp: new Date().toISOString(),
       triggeredAt: new Date().toISOString()
     };
     ```

2. **workflow-trigger.js**:
   - Simplified payload structure for webhook compatibility:
     ```javascript
     // Old format
     const payload = {
       contact: {
         ...contact,
         triggeredAt: new Date().toISOString(),
         source: 'AI Cold Call Agent Dashboard'
       }
     };
     
     // New format 
     const payload = {
       Name: contact.name,
       Phone: contact.phone,
       email: contact.email || '',
       Industry: contact.industry || '',
       CompanyInfo: contact.company || '',
       CallStatus: contact.status || 'Pending',
       source: 'AI Cold Call Agent Dashboard',
       triggeredAt: new Date().toISOString()
     };
     ```

3. **api.js**:
   - Updates error handling to ensure proper logging without breaking the UI flow

## About the n8n Workflow

The workflow you're implementing has multiple components:

1. **Webhook Triggers**:
   - Main webhook for starting calls (ID: YOUR_WEBHOOK_ID)
   - Webhook for booking appointments (ID: YOUR_BOOKING_WEBHOOK_ID)
   - Webhook for checking availability (ID: YOUR_AVAILABILITY_WEBHOOK_ID)

2. **Call Processing Logic**:
   - Updates call status in Google Sheets
   - Processes callbacks and scheduling
   - Handles meeting bookings
   - Sends email confirmations
   - Creates calendar events

3. **Data Flow**:
   - Your AI Cold Call Website sends contact data to n8n
   - n8n initiates calls via Vapi.ai
   - Call results update Google Sheets
   - Meeting booking confirmations send emails
   - Calendar events get created

## After Deployment

1. Access the website at http://YOUR_SERVER_IP:3000/
2. Click "Start Workflow"
3. Check if the workflow trigger works correctly:
   - If it shows a success message, check the n8n execution list
   - If it shows a demo mode message, check your webhook configuration
   
4. Verify the full cycle:
   - Make a test call
   - Check Google Sheets for updates
   - Test meeting booking functionality

## Troubleshooting

If you encounter issues:

1. **Check n8n logs**:
   ```bash
   docker logs $(docker ps -q --filter "name=n8n")
   ```

2. **Verify webhook paths**:
   - Ensure the main webhook path in n8n matches your .env file: `/webhook/YOUR_WEBHOOK_ID`
   - Ensure all webhooks are activated in n8n

3. **Test direct webhook access**:
   ```bash
   curl -X POST http://YOUR_SERVER_IP:8080/webhook/YOUR_WEBHOOK_ID -H "Content-Type: application/json" -d '{"test": true}'
   ```

4. **Check Google credentials** if sheet updates fail

For persistent issues, consult the detailed n8n execution logs or contact technical support.
