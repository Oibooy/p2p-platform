const { validationResult } = require('express-validator');
const metrics = require('../services/metricsService');

const validateInput = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            metrics.increment('validation.failure');
            return next({ status: 400, message: 'Ошибка валидации', errors: errors.array() });
        }
        metrics.increment('validation.success');
        next();
    };
};

module.exports = validateInput;