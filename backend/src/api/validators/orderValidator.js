const { body, query } = require('express-validator');

const createOrderValidator = [
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .isIn(['buy', 'sell'])
    .withMessage('Invalid order type'),
  body('price')
    .isFloat({ min: 0.000001 })
    .withMessage('Price must be greater than 0'),
  body('expirationHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiration must be between 1 and 168 hours')
];

const validateOrderId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID format')
];

const getOrdersValidator = [
  query('type')
    .optional()
    .isIn(['buy', 'sell'])
    .withMessage('Invalid order type'),
  query('status')
    .optional()
    .isIn(['open', 'closed', 'cancelled'])
    .withMessage('Invalid status'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be non-negative'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be non-negative'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  createOrderValidator,
  getOrdersValidator
};
