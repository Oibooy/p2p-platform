const { body } = require('express-validator');
const { ValidationError } = require('../../infrastructure/errors');

// Validation rules for creating a dispute
const createDisputeValidator = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID format'),

  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString().withMessage('Reason must be a string')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
    .trim()
    .escape(),

  body('evidence')
    .optional()
    .isURL().withMessage('Evidence must be a valid URL')
];

// Validation rules for resolving a dispute
const resolveDisputeValidator = [
  body('resolution')
    .notEmpty().withMessage('Resolution is required')
    .isIn(['refund', 'complete', 'cancel'])
    .withMessage('Invalid resolution type'),

  body('comment')
    .optional()
    .isString().withMessage('Comment must be a string')
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters')
    .trim()
    .escape()
];

// Direct validation function for programmatic use
const validateDispute = async (data) => {
  const { orderId, reason } = data;

  if (!orderId) {
    throw new ValidationError('Order ID is required');
  }

  if (!reason || reason.length < 10 || reason.length > 500) {
    throw new ValidationError('Reason must be between 10 and 500 characters');
  }
};

module.exports = {
  createDisputeValidator,
  resolveDisputeValidator,
  validateDispute
};