
const { body } = require('express-validator');

const messageValidator = [
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
];

module.exports = {
  messageValidator
};
