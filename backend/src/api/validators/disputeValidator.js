
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
