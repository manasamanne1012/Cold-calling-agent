# AI Cold Call Agent - Client Interface

A simple, user-friendly web interface that allows clients to manage their lead data and trigger AI-powered cold calling campaigns.

## 🚀 Features

- **📊 Google Sheets Integration**: Direct access to edit lead data in your spreadsheet
- **🤖 One-Click Workflow Trigger**: Start your AI cold calling campaign with a single button
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **⚡ Real-time Status Updates**: Track the progress of your campaigns
- **🎯 Minimalist Interface**: Clean, distraction-free design focused on functionality

## 🛠️ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
# Set your n8n webhook URL
N8N_WEBHOOK_URL=http://your-n8n-instance.com/webhook/your-webhook-id
```

### 3. Update Google Sheets URL
Edit `public/index.html` and replace the Google Sheets URL with your own:
```html
<iframe 
    src="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing&rm=minimal"
    ...>
</iframe>
```

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Access the Interface
Open your browser and go to: `http://localhost:3000`

## 📋 How It Works

1. **Edit Leads**: Clients can directly edit the Google Sheet embedded in the website
2. **Trigger Campaign**: Click the "Start AI Cold Calling" button to initiate the workflow
3. **Monitor Progress**: Real-time status updates show the campaign progress
4. **Automated Process**: The AI agent processes leads and makes calls according to your n8n workflow

## 🔧 Configuration

### Connecting to Your n8n Workflow

1. In your n8n workflow, note the webhook URL for manual triggers
2. Update the `N8N_WEBHOOK_URL` in your `.env` file
3. The interface will send a POST request to this URL when "Start" is clicked

### Google Sheets Setup

1. Make sure your Google Sheet is publicly accessible (with edit permissions)
2. The sheet should have columns: Name, Phone, Industry, Email, CallStatus, etc.
3. Replace the sheet URL in `public/index.html` with your sheet ID

## 🎨 Interface Overview

- **Header**: Shows system status and branding
- **Instructions**: Clear steps for using the interface
- **Google Sheets**: Embedded spreadsheet for data management
- **Control Panel**: Large "Start" button to trigger campaigns
- **Status Log**: Real-time updates and campaign progress

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Railway
```bash
# Connect to Railway
railway login
railway init
railway up
```

### Render
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically from GitHub

## 📱 Mobile Responsive

The interface is fully responsive and works great on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers
- 🖥️ Large monitors

## 🔒 Security Notes

- The Google Sheet should be configured with appropriate sharing permissions
- Consider adding authentication if handling sensitive data
- Use HTTPS in production environments
- Keep your n8n webhook URLs secure

## 🛠️ Customization

### Branding
- Update the logo/title in `public/index.html`
- Modify colors in `public/styles.css`
- Add your company branding

### Functionality
- Add more status tracking in `public/script.js`
- Customize the Google Sheets integration
- Add additional API endpoints in `server.js`

## 📊 API Endpoints

- `POST /api/trigger-workflow` - Triggers the AI cold call workflow
- `GET /api/workflow-status` - Gets current workflow status
- `GET /health` - Health check endpoint

## 🤝 Support

If you need help setting up or customizing this interface:

1. Check the troubleshooting section below
2. Review the code comments for guidance
3. Test with your n8n workflow using the provided webhook format

## 🔧 Troubleshooting

### Common Issues

**"Failed to trigger workflow"**
- Check that your n8n instance is running and accessible
- Verify the webhook URL in your `.env` file
- Ensure the webhook is properly configured in n8n

**Google Sheets not loading**
- Verify the sheet is publicly accessible
- Check the sharing permissions
- Ensure the URL is correct in the HTML

**Button not working**
- Check browser console for JavaScript errors
- Verify the server is running on the correct port
- Test the `/health` endpoint

### Development Tips

- Use `npm run dev` for development with auto-reload
- Check browser developer tools for network/console errors
- Test the API endpoints directly with tools like Postman
- Monitor server logs for debugging information

## 📝 License

MIT License - Feel free to customize and use for your projects.

---

**Ready to start your AI-powered cold calling campaigns? 🚀**
