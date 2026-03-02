/**
 * Cache Control Middleware
 * Ensures browsers don't use cached versions of pages
 */
function cacheControlMiddleware(req, res, next) {
  // Set cache control headers for HTML files
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
}

module.exports = cacheControlMiddleware;
