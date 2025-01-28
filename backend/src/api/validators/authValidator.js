
const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
];

const loginValidator = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').exists().withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};
