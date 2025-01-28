
const { body } = require('express-validator');

const createDealValidator = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0')
];

module.exports = {
  createDealValidator
};
