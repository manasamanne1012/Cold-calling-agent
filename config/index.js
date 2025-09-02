/**
 * Configuration
 * Central configuration for the AI Cold Call Agent application
 */
require('dotenv').config();

// Helper to get environment variables with fallbacks
const getEnv = (key, defaultValue) => {
  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
};

// Main configuration object
const config = {
  // Server configuration
  server: {
    port: getEnv('PORT', 3000),
    env: getEnv('NODE_ENV', 'development'),
    host: getEnv('HOST', 'localhost'),
    logLevel: getEnv('LOG_LEVEL', 'info'),
    baseUrl: getEnv('BASE_URL', `http://localhost:${getEnv('PORT', 3000)}`)
  },
  
  // N8N workflow configuration
  n8n: {
    webhookUrl: getEnv('N8N_WEBHOOK_URL', ''),
    apiKey: getEnv('N8N_API_KEY', ''),
    baseUrl: getEnv('N8N_BASE_URL', '')
  },
  
  // Google Sheets integration
  googleSheets: {
    credentialsPath: getEnv('GOOGLE_APPLICATION_CREDENTIALS', './credentials.json'),
    spreadsheetId: getEnv('GOOGLE_SPREADSHEET_ID', ''),
    callLogsSheet: getEnv('CALL_LOGS_SHEET_NAME', 'Call Logs'),
    contactsSheet: getEnv('CONTACTS_SHEET_NAME', 'Contacts')
  },
  
  // Database configuration
  database: {
    // If using a database, configure connection here
    type: getEnv('DB_TYPE', 'file'), // 'file', 'mongodb', 'postgres', etc.
    path: getEnv('DB_PATH', './data') // Path for file-based storage
  },
  
  // Feature flags
  features: {
    enableRealTimeData: getEnv('ENABLE_REAL_TIME_DATA', 'true') === 'true',
    enableAnalytics: getEnv('ENABLE_ANALYTICS', 'true') === 'true',
    enableNotifications: getEnv('ENABLE_NOTIFICATIONS', 'true') === 'true',
    demoMode: getEnv('DEMO_MODE', 'false') === 'true'
  },
  
  // Security settings
  security: {
    cookieSecret: getEnv('COOKIE_SECRET', 'ai-cold-call-agent-secret'),
    jwtSecret: getEnv('JWT_SECRET', 'ai-cold-call-agent-jwt-secret'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '1d')
  }
};

module.exports = config;
