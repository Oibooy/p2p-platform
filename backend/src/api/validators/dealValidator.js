
const { body } = require('express-validator');

const createDealValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('seller').notEmpty().withMessage('Seller address is required'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0'),
  body('deadline')
    .isInt({ min: Date.now() })
    .withMessage('Deadline must be in the future')
];

const releaseFundsValidator = [
  body('dealId').notEmpty().withMessage('Deal ID is required'),
  body('token').notEmpty().withMessage('Token is required')
];

const refundFundsValidator = [
  body('dealId').notEmpty().withMessage('Deal ID is required'),
  body('token').notEmpty().withMessage('Token is required')
];

module.exports = {
  createDealValidator,
  releaseFundsValidator,
  refundFundsValidator
};
