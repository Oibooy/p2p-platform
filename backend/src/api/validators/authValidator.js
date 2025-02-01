// src/api/validators/authValidator.js
const { body, param, header } = require('express-validator');

exports.registerValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
];

exports.loginValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

exports.forgotPasswordValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
];

exports.resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
];

exports.confirmEmailValidator = [
  param('token')
    .notEmpty().withMessage('Token is required')
    .isJWT().withMessage('Invalid token format'),
];

exports.resendConfirmationValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
];

exports.getCurrentUserValidator = [
  header('authorization')
    .notEmpty().withMessage('Authorization header is required')
    .isJWT().withMessage('Invalid token format'),
];