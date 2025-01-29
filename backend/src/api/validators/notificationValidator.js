
const { query } = require('express-validator');

const getNotificationsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('read')
    .optional()
    .isBoolean()
    .withMessage('Read status must be a boolean')
];

module.exports = {
  getNotificationsValidator
};
