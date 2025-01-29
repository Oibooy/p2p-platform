
const { body } = require('express-validator');

const createDisputeValidator = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('reason')
    .isLength({ min: 10 })
    .withMessage('Reason must be at least 10 characters long')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

const resolveDisputeValidator = [
  body('resolution')
    .isIn(['refund', 'complete', 'cancel'])
    .withMessage('Invalid resolution status')
];

module.exports = {
  createDisputeValidator,
  resolveDisputeValidator
};
const { body } = require('express-validator');

const createDisputeValidator = [
  body('orderId').notEmpty().isMongoId().withMessage('Valid order ID is required'),
  body('reason')
    .notEmpty()
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

const resolveDisputeValidator = [
  body('resolution')
    .isIn(['refund', 'complete'])
    .withMessage('Invalid resolution type')
];

module.exports = {
  createDisputeValidator,
  resolveDisputeValidator
};
const { body } = require('express-validator');
const { ValidationError } = require('../../infrastructure/errors');

const validateDispute = async (data) => {
  const { orderId, reason } = data;
  
  if (!orderId) {
    throw new ValidationError('ID заказа обязателен');
  }
  
  if (!reason || reason.length < 10) {
    throw new ValidationError('Причина спора должна содержать минимум 10 символов');
  }
};

const disputeValidation = [
  body('orderId').notEmpty().withMessage('ID заказа обязателен'),
  body('reason')
    .isLength({ min: 10 })
    .withMessage('Причина спора должна содержать минимум 10 символов'),
  body('resolution')
    .optional()
    .isIn(['refund', 'complete'])
    .withMessage('Неверный тип разрешения спора')
];

module.exports = {
  validateDispute,
  disputeValidation
};
