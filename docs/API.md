# AI Cold Call Agent API Documentation

This document provides detailed information about the API endpoints available in the AI Cold Call Agent application.

## Base URL

All endpoints are relative to the base URL of your server:
```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication for local development. For production deployment, it is recommended to implement proper authentication.

## API Endpoints

### Dashboard Data

#### GET `/api/dashboard-data`

Returns real-time dashboard metrics and KPIs.

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "meetingsBooked": 2,
    "pending": 1,
    "scheduled": 1,
    "pendingRecall": 4,
    "totalLeads": 10,
    "successRate": 25,
    "dataSource": "google_sheets"
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Analytics

#### GET `/api/analytics`

Returns advanced analytics with optional date filtering.

**Query Parameters:**
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "message": "Analytics data retrieved successfully",
  "data": {
    "callTrends": [...],
    "conversionRates": {...},
    "performanceByDay": [...],
    "periodComparison": {...}
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Campaign Status

#### GET `/api/campaign-status`

Returns information about the current calling campaign.

**Response:**
```json
{
  "success": true,
  "message": "Campaign status retrieved successfully",
  "data": {
    "isActive": true,
    "startTime": "2025-09-01T09:00:00.000Z",
    "totalCalls": 25,
    "completedCalls": 15,
    "remainingCalls": 10,
    "estimatedCompletion": "2025-09-01T15:30:00.000Z"
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Activity Feed

#### GET `/api/activity`

Returns a list of recent activities and events.

**Query Parameters:**
- `limit` (optional): Maximum number of activities to return (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Activity feed retrieved successfully",
  "data": {
    "activities": [
      {
        "type": "call_completed",
        "timestamp": "2025-09-01T12:30:00.000Z",
        "details": {
          "contactName": "John Smith",
          "outcome": "meeting_booked",
          "callDuration": 245
        }
      },
      ...
    ]
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Trigger Workflow

#### POST `/api/trigger-workflow`

Starts an AI calling campaign.

**Request Body:**
```json
{
  "source": "dashboard",
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow triggered successfully",
  "data": {
    "workflowId": "12345",
    "estimatedCalls": 10,
    "startTime": "2025-09-01T12:34:56.789Z"
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Contacts

#### GET `/api/contacts`

Returns the contact database.

**Query Parameters:**
- `limit` (optional): Maximum number of contacts to return (default: 100)
- `offset` (optional): Number of contacts to skip (default: 0)
- `status` (optional): Filter by call status

**Response:**
```json
{
  "success": true,
  "message": "Contacts retrieved successfully",
  "data": {
    "contacts": [...],
    "total": 100,
    "limit": 10,
    "offset": 0
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Health Check

#### GET `/api/health`

Returns the health status of the system.

**Response:**
```json
{
  "success": true,
  "message": "System is healthy",
  "data": {
    "status": "healthy",
    "googleSheets": "connected",
    "n8nWorkflow": "available",
    "uptime": 3600,
    "memory": {
      "used": "120MB",
      "total": "512MB"
    }
  },
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

### Export

#### GET `/api/export/:type`

Exports data in various formats. Valid types are `json` and `csv`.

**Response:**
- For `json`: A JSON file download
- For `csv`: A CSV file download

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message describing the issue",
  "statusCode": 400,
  "timestamp": "2025-09-01T12:34:56.789Z"
}
```

Common status codes:
- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server-side issue

## Rate Limiting

Currently, there is no rate limiting implemented. For production deployment, consider implementing appropriate rate limits.
