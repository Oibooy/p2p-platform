
const { validationResult } = require('express-validator');
const { ValidationError } = require('../../infrastructure/errors');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    throw new ValidationError(`Validation error: ${firstError.msg}`, {
      field: firstError.param,
      value: firstError.value
    });
  }
  next();
};

module.exports = validateRequest;
