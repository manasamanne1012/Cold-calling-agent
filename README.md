# AI Cold Call Automation Platform

A full-stack web dashboard for managing and automating AI-powered cold calling campaigns. The platform integrates with n8n workflow automation, Vapi.ai voice agents, Google Sheets, Google Calendar, and Gmail to deliver an end-to-end sales automation solution.

## Features

- **Real-time Dashboard** - Live KPI tracking with success rate, meetings booked, pending calls, and call analytics
- **Contact Management** - CRUD operations on leads with Google Sheets as the primary data store
- **AI Voice Calling** - Trigger AI-powered cold calls via Vapi.ai through n8n webhook integration
- **Auto Scheduling** - Checks Google Calendar availability and books meeting slots automatically
- **Email Confirmations** - Sends meeting confirmation emails via Gmail API after successful bookings
- **Workflow Automation** - n8n orchestrates the entire call-to-booking pipeline through webhooks

## Architecture

```
┌──────────────┐     Webhook      ┌──────────────┐     API Call     ┌──────────────┐
│   Dashboard  │ ──────────────── │     n8n      │ ──────────────── │   Vapi.ai    │
│  (Express +  │                  │  (Workflow    │                  │  (AI Voice   │
│   Tailwind)  │                  │   Engine)    │                  │    Agent)    │
└──────┬───────┘                  └──────┬───────┘                  └──────────────┘
       │                                 │
       │ REST API                        │ APIs
       │                                 │
┌──────┴───────┐                  ┌──────┴───────┐
│ Google Sheets│                  │   Google     │
│  (Contacts   │                  │  Calendar +  │
│   Database)  │                  │    Gmail     │
└──────────────┘                  └──────────────┘
```

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Backend    | Node.js, Express.js                |
| Frontend   | HTML, Tailwind CSS, Vanilla JS     |
| Database   | Google Sheets API (Service Account)|
| Automation | n8n (Webhook-based workflows)      |
| Voice AI   | Vapi.ai                            |
| Scheduling | Google Calendar API                |
| Email      | Gmail API                          |
| Logging    | Winston (structured logging)       |
| Testing    | Mocha, Chai, Sinon, Puppeteer      |

## Project Structure

```
├── server.js                    # Express server entry point
├── config/index.js              # Centralized configuration
├── public/                      # Frontend (dashboard UI)
│   └── index.html               # Main dashboard with KPI widgets
├── src/
│   ├── middleware/               # Express middleware
│   │   ├── cacheControl.js      # Cache headers
│   │   └── errorHandler.js      # Centralized error handling
│   ├── routes/                   # REST API endpoints
│   │   ├── api.js               # KPI and analytics endpoints
│   │   ├── contacts.js          # Contact CRUD operations
│   │   ├── pages.js             # Page routes
│   │   └── root.js              # Root redirects
│   ├── services/                 # Business logic layer
│   │   ├── googleSheets.js      # Google Sheets read/write
│   │   ├── n8nService.js        # n8n webhook integration
│   │   ├── csvData.js           # Local CSV fallback storage
│   │   └── workflow-trigger.js  # Workflow trigger service
│   └── utils/                    # Utilities
│       ├── analytics.js         # KPI calculation engine
│       ├── logger.js            # Winston logger setup
│       └── responseFormatter.js # API response formatting
├── test/                         # Test suite
│   ├── unit/                    # Unit tests (KPI logic, analytics)
│   ├── integration/             # API and performance tests
│   └── e2e/                     # End-to-end browser tests
├── n8n-workflow.json             # n8n workflow definition (importable)
├── docs/                         # Documentation
└── .env.example                  # Environment variable template
```

## Getting Started

### Prerequisites

- Node.js 16+
- Google Cloud project with Sheets API enabled
- n8n instance (self-hosted or cloud)
- Vapi.ai account (for AI voice calling)

### Installation

```bash
git clone https://github.com/manasamanne1012/Cold-calling-agent.git
cd Cold-calling-agent
npm install
```

### Configuration

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Key environment variables:

| Variable               | Description                        |
|------------------------|------------------------------------|
| `PORT`                 | Server port (default: 3000)        |
| `GOOGLE_SHEETS_API_KEY`| Google Sheets API key              |
| `GOOGLE_SPREADSHEET_ID`| Target spreadsheet ID              |
| `N8N_WEBHOOK_URL`      | n8n instance base URL              |
| `N8N_WEBHOOK_PATH`     | Webhook trigger path               |

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open `http://localhost:3000` to access the dashboard.

### Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:coverage # Generate coverage report
```

## How It Works

1. **Lead Upload** - Import contacts via Google Sheets or add manually through the dashboard
2. **Trigger Call** - Click "Trigger Workflow" to send a webhook to n8n
3. **AI Conversation** - n8n triggers Vapi.ai which makes the call and talks to the lead
4. **Availability Check** - If the lead is interested, the system checks Google Calendar for open slots
5. **Book Meeting** - Automatically books a meeting and updates the contact status
6. **Email Confirmation** - Sends a confirmation email to the lead via Gmail
7. **Dashboard Update** - KPIs refresh in real-time showing updated success rates and call outcomes

## n8n Workflow

The `n8n-workflow.json` file contains the complete automation workflow. Import it into your n8n instance:

1. Open n8n > Workflows > Import from File
2. Select `n8n-workflow.json`
3. Update credentials (Vapi API key, Google OAuth, etc.)
4. Activate the workflow

## License

MIT
