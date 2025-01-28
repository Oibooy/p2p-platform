
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateAmount = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0'),
  handleValidationErrors
];

const validateDealCreation = [
  body('buyerAddress').isString().notEmpty().withMessage('Buyer address is required'),
  body('sellerAddress').isString().notEmpty().withMessage('Seller address is required'),
  body('amount').isFloat({ min: 0.000001 }).withMessage('Invalid amount'),
  body('deadline').isInt({ min: Date.now() }).withMessage('Invalid deadline'),
  handleValidationErrors
];

module.exports = {
  validateAmount,
  validateDealCreation,
  handleValidationErrors
};
