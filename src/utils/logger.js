/**
 * Logger Utility
 * Provides standardized logging using Winston
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logs subdirectories
const logsDirs = ['errors', 'requests', 'performance'];
logsDirs.forEach(dir => {
  const dirPath = path.join(logsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Custom format with emojis and colors
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let emoji = '';
  
  switch (level) {
    case 'error':
      emoji = '❌';
      break;
    case 'warn':
      emoji = '⚠️';
      break;
    case 'info':
      emoji = '📊';
      break;
    case 'http':
      emoji = '🌐';
      break;
    case 'debug':
      emoji = '🔍';
      break;
    default:
      emoji = '📝';
  }
  
  const metaString = Object.keys(meta).length ? 
    JSON.stringify(meta, null, 2) : '';
  
  return `${timestamp} ${emoji} [${level.toUpperCase()}]: ${message} ${metaString}`;
});

// Create Winston logger
const logger = winston.createLogger({
  level: config?.server?.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    
    // Log all errors separately
    new winston.transports.File({ 
      filename: path.join(logsDir, 'errors', 'error.log'), 
      level: 'error'
    }),
    
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log')
    }),
    
    // HTTP request logs
    new winston.transports.File({
      filename: path.join(logsDir, 'requests', 'requests.log'),
      level: 'http'
    })
  ]
});

// Create a performance logger instance
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance', 'performance.log')
    })
  ]
});

// Log HTTP requests
const logRequest = (req, res, time) => {
  const status = res.statusCode;
  const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
  
  logger.http(`${statusEmoji} ${req.method} ${req.url} ${status} - ${time}ms`, {
    method: req.method,
    url: req.url,
    status,
    responseTime: time,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });
};

// Log performance metrics
const logPerformance = (metric, value, tags = {}) => {
  performanceLogger.info(`Performance: ${metric}`, {
    metric,
    value,
    ...tags,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  logRequest,
  logPerformance
};