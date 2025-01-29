
const { body } = require('express-validator');

const validateReview = [
  body('dealId').isMongoId().withMessage('Invalid deal ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').isString().trim().isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters')
];

const validateReviewUpdate = [
  body('rating').optional().isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().trim().isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters')
];

module.exports = {
  validateReview,
  validateReviewUpdate
};
