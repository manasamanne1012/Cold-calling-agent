/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */
const { logger } = require('../utils/logger');
const { formatError } = require('../utils/responseFormatter');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    params: req.params,
    body: req.body
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';
  
  // Use the existing response formatter if available
  if (res.error) {
    return res.error(errorMessage, statusCode, err);
  }
  
  // Fallback to manual formatting if middleware not initialized
  res.status(statusCode).json(formatError(
    errorMessage, 
    statusCode, 
    process.env.NODE_ENV !== 'production' ? err : null
  ));
}

module.exports = errorHandler;