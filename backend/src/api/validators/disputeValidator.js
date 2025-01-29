
const { body, param } = require('express-validator');
const { ValidationError } = require('../../infrastructure/errors');
const DisputeRepository = require('../../db/repositories/DisputeRepository');
const OrderRepository = require('../../db/repositories/OrderRepository');

const createDisputeValidator = [
  body('orderId')
    .notEmpty().withMessage('ID заказа обязателен')
    .isMongoId().withMessage('Неверный формат ID заказа'),
    
  body('reason')
    .notEmpty().withMessage('Причина обязательна')
    .isString().withMessage('Причина должна быть строкой')
    .isLength({ min: 10, max: 500 })
    .withMessage('Причина должна содержать от 10 до 500 символов')
    .trim(),
    
  body('evidence')
    .optional()
    .isArray().withMessage('Доказательства должны быть массивом')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Максимум 5 доказательств');
      }
      return true;
    })
];

const resolveDisputeValidator = [
  param('id')
    .isMongoId().withMessage('Неверный формат ID спора'),
    
  body('resolution')
    .notEmpty().withMessage('Решение обязательно')
    .isIn(['refund', 'release'])
    .withMessage('Неверный тип решения'),
    
  body('comment')
    .notEmpty().withMessage('Комментарий обязателен')
    .isString().withMessage('Комментарий должен быть строкой')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен содержать от 10 до 1000 символов')
];

const validateBusinessRules = async (orderId, userId) => {
  const disputeRepository = new DisputeRepository();
  const orderRepository = new OrderRepository();

  const existingDispute = await disputeRepository.findOne({ order: orderId });
  if (existingDispute) {
    throw new ValidationError('Спор по этому заказу уже существует');
  }

  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new ValidationError('Заказ не найден');
  }

  if (order.status === 'disputed') {
    throw new ValidationError('Заказ уже находится в состоянии спора');
  }

  const disputeCount = await disputeRepository.countUserDisputes(userId, 24);
  if (disputeCount >= 5) {
    throw new ValidationError('Превышен дневной лимит споров');
  }
};

module.exports = {
  createDisputeValidator,
  resolveDisputeValidator,
  validateBusinessRules
};
