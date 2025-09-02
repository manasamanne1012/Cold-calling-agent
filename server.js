/**
 * AI Cold Call Agent Server
 * Main server application entry point
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/index');
const { logger } = require('./src/utils/logger');
const { responseFormatterMiddleware } = require('./src/utils/responseFormatter');
const errorHandler = require('./src/middleware/errorHandler');

// Import route modules
const apiRoutes = require('./src/routes/api');
const contactRoutes = require('./src/routes/contacts');
const pageRoutes = require('./src/routes/pages');

// Import services
const sheetsService = require('./src/services/googleSheets');

logger.info('🔧 Starting AI Cold Call Agent Server...');

// Initialize Express application
const app = express();
const PORT = config.server.port;

// Initialize Google Sheets
sheetsService.initGoogleSheets();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    logger.http(`${method} ${url} ${statusCode} - ${duration}ms`, {
      method, url, statusCode, duration, ip
    });
  });
  
  next();
});

// Apply middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(responseFormatterMiddleware);

// Apply routes
app.use('/', pageRoutes);
app.use('/api', apiRoutes);
app.use('/api/contacts', contactRoutes);

// 404 handler - must be before the error handler
app.use((req, res) => {
  res.notFound(`Endpoint not found: ${req.method} ${req.path}`);
});

// Error handling middleware - must be last
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info('🚀 AI Cold Call Dashboard Server Started');
  logger.info('='.repeat(50));
  logger.info(`📍 Server running on: http://localhost:${PORT}`);
  logger.info(`🌐 Dashboard URL: http://localhost:${PORT}`);
  logger.info(`🔗 Webhook URL: ${config.n8n.webhookUrl || 'Not configured (Demo mode)'}`);
  logger.info(`📊 API Endpoints available:`);
  logger.info(`   GET  /api/dashboard-data - Real-time dashboard metrics`);
  logger.info(`   GET  /api/analytics - Advanced analytics with date filtering`);
  logger.info(`   GET  /api/campaign-status - Current campaign information`);
  logger.info(`   GET  /api/activity - Recent activity feed`);
  logger.info(`   POST /api/trigger-workflow - Start AI calling campaign`);
  logger.info(`   GET  /api/contacts - Lead database access`);
  logger.info(`   GET  /api/health - System health check`);
  logger.info(`   GET  /api/export/:type - Export data in various formats`);
  logger.info('='.repeat(50));
  logger.info(`⏰ Started at: ${new Date().toLocaleString()}`);
  
  if (!config.n8n.webhookUrl) {
    logger.warn('⚠️  WARNING: N8N_WEBHOOK_URL not set - running in demo mode');
    logger.warn('   Set N8N_WEBHOOK_URL in .env file for production use');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
