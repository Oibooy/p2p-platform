const { body, validationResult } = require('express-validator');
const logger = require('../../infrastructure/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ 
      status: 'error',
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  next();
};

const validateAmount = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.000001, max: 999999999 })
    .withMessage('Amount must be between 0.000001 and 999999999')
    .trim(),
  handleValidationErrors
];

const validateDealCreation = [
  body('buyerAddress')
    .isString()
    .notEmpty()
    .withMessage('Buyer address is required')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Invalid address format'),
  body('sellerAddress')
    .isString()
    .notEmpty()
    .withMessage('Seller address is required')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Invalid address format'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Invalid amount'),
  body('deadline')
    .isInt({ min: Date.now() })
    .withMessage('Deadline must be in the future'),
  body('currency')
    .isString()
    .notEmpty()
    .withMessage('Currency is required'),
  handleValidationErrors
];

const { body: body2 } = require('express-validator');

exports.validateReview = [
  body2('dealId').isMongoId().withMessage('Invalid deal ID'),
  body2('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body2('comment').isString().trim().isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters')
];

exports.validateReviewUpdate = [
  body2('rating').optional().isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body2('comment').optional().isString().trim().isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters')
];

module.exports = {
  validateAmount,
  validateDealCreation,
  handleValidationErrors,
  validateReview,
  validateReviewUpdate
};