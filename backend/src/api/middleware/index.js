const { verifyToken, checkRole, checkRevokedToken } = require('./authMiddleware');
const { isModerator, isAdmin, hasRole } = require('./roleMiddleware');
const { errorHandler } = require('./errorHandler');
const { apiLimiter, authLimiter } = require('./rateLimiter');
const { validateRequest } = require('./validationMiddleware');
const adminLogger = require('./adminLogger');
const performanceMonitor = require('./performanceMonitor');

module.exports = {
  // Auth middleware
  verifyToken,
  checkRole,
  checkRevokedToken,
  
  // Role middleware
  isModerator, 
  isAdmin,
  hasRole,
  
  // Request handling
  errorHandler,
  validateRequest,
  
  // Rate limiting
  apiLimiter,
  authLimiter,
  
  // Logging and monitoring
  adminLogger,
  performanceMonitor
};
