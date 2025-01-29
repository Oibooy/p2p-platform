
const { verifyToken, checkRole, checkRevokedToken } = require('./authMiddleware');
const { isModerator, isAdmin, hasRole } = require('./roleMiddleware');
const { errorHandler } = require('./errorHandler');
const { apiLimiter, authLimiter } = require('./rateLimiter');
const adminLogger = require('./adminLogger');
const performanceMonitor = require('./performanceMonitor');
const validateRequest = require('./validationMiddleware');

module.exports = {
  verifyToken,
  checkRole,
  checkRevokedToken,
  isModerator, 
  isAdmin,
  hasRole,
  errorHandler,
  apiLimiter,
  authLimiter,
  adminLogger,
  performanceMonitor,
  validateRequest
};
