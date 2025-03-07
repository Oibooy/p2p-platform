const { verifyToken, checkRole, checkRevokedToken } = require('./authMiddleware');
const { isModerator, isAdmin, hasRole } = require('./roleMiddleware');
const { errorHandler, asyncHandler } = require('./errorHandler');
const { apiLimiter, authLimiter, forgotPasswordLimiter, resetPasswordLimiter, confirmEmailLimiter, resendConfirmationLimiter } = require('./rateLimiter');
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
  asyncHandler,
  validateRequest,
  
  // Rate limiting
  apiLimiter,
  authLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  confirmEmailLimiter,
  resendConfirmationLimiter,
  
  // Logging and monitoring
  adminLogger,
  performanceMonitor
};
