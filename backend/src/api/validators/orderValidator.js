
const { body } = require('express-validator');

const createOrderValidator = [
  body('type').isIn(['buy', 'sell']).withMessage('Invalid order type'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than 0')
];

module.exports = {
  createOrderValidator
};
