
const { body } = require('express-validator');
const { ValidationError } = require('../../infrastructure/errors');

const registerValidator = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[A-Za-z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain both letters and numbers')
];

const loginValidator = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain both letters and numbers')
];

module.exports = {
  registerValidator,
  loginValidator,
  resetPasswordValidator
};
