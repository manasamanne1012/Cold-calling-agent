/**
 * Response Formatter Utility
 * Provides standardized API response formatting
 */

/**
 * Format success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted response object
 */
function formatSuccess(data, message = 'Operation successful', statusCode = 200, meta = {}) {
  return {
    success: true,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString(),
    ...meta
  };
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Error} error - Original error object
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted error response
 */
function formatError(message = 'An error occurred', statusCode = 500, error = null, meta = {}) {
  const response = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...meta
  };

  // Include error details in development environment
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

/**
 * Express middleware to add response formatter methods to res object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function responseFormatterMiddleware(req, res, next) {
  // Add success method to res
  res.success = function(data, message, meta = {}) {
    return this.status(200).json(formatSuccess(data, message, 200, meta));
  };

  // Add created method to res
  res.created = function(data, message = 'Resource created successfully', meta = {}) {
    return this.status(201).json(formatSuccess(data, message, 201, meta));
  };

  // Add error method to res
  res.error = function(message, statusCode = 500, error = null, meta = {}) {
    return this.status(statusCode).json(formatError(message, statusCode, error, meta));
  };

  // Add badRequest method to res
  res.badRequest = function(message = 'Bad request', error = null, meta = {}) {
    return this.status(400).json(formatError(message, 400, error, meta));
  };

  // Add notFound method to res
  res.notFound = function(message = 'Resource not found', error = null, meta = {}) {
    return this.status(404).json(formatError(message, 404, error, meta));
  };

  // Add unauthorized method to res
  res.unauthorized = function(message = 'Unauthorized', error = null, meta = {}) {
    return this.status(401).json(formatError(message, 401, error, meta));
  };

  next();
}

module.exports = {
  formatSuccess,
  formatError,
  responseFormatterMiddleware
};