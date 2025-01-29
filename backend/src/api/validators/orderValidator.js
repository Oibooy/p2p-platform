
const { body } = require('express-validator');
const { ValidationError } = require('../../infrastructure/errors');

const createOrderValidator = [
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be positive'),
  body('type')
    .isIn(['buy', 'sell'])
    .withMessage('Invalid order type'),
  body('price')
    .isFloat({ min: 0.000001 })
    .withMessage('Price must be positive'),
  body('expirationHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiration must be between 1 and 168 hours')
];

const updateOrderValidator = [
  body('price')
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage('Price must be positive'),
  body('status')
    .optional()
    .isIn(['open', 'closed', 'cancelled'])
    .withMessage('Invalid status')
];

module.exports = {
  createOrderValidator,
  updateOrderValidator
};
