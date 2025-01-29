
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

const validateBusinessRules = async (orderId, userId, reason, evidence) => {
  const disputeRepository = new DisputeRepository();
  const orderRepository = new OrderRepository();

  // Базовые проверки
  const existingDispute = await disputeRepository.findOne({ order: orderId });
  if (existingDispute) {
    throw new ValidationError('Спор по этому заказу уже существует');
  }

  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new ValidationError('Заказ не найден');
  }

  // Проверки статуса заказа
  if (!['in_progress', 'completed'].includes(order.status)) {
    throw new ValidationError('Создание спора доступно только для заказов в процессе или завершенных');
  }

  if (order.status === 'disputed') {
    throw new ValidationError('Заказ уже находится в состоянии спора');
  }

  // Проверка прав на создание спора
  if (order.buyer.toString() !== userId && order.seller.toString() !== userId) {
    throw new ValidationError('Только участники сделки могут создавать споры');
  }

  // Временные ограничения
  const orderAge = (Date.now() - order.createdAt) / (1000 * 60 * 60 * 24); // в днях
  if (orderAge > 30) {
    throw new ValidationError('Срок создания спора по заказу истек (30 дней)');
  }

  // Лимиты на количество споров
  const disputeCount = await disputeRepository.countUserDisputes(userId, 24);
  if (disputeCount >= 5) {
    throw new ValidationError('Превышен дневной лимит споров (5 споров/24ч)');
  }

  const monthlyDisputes = await disputeRepository.countUserDisputes(userId, 24 * 30);
  if (monthlyDisputes >= 30) {
    throw new ValidationError('Превышен месячный лимит споров (30 споров/месяц)');
  }

  // Валидация доказательств
  if (evidence && evidence.length > 0) {
    if (evidence.length > 5) {
      throw new ValidationError('Максимальное количество доказательств - 5');
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const invalidEvidence = evidence.find(e => !validTypes.includes(e.type));
    if (invalidEvidence) {
      throw new ValidationError('Неподдерживаемый формат файла доказательства');
    }
  }

  // Проверка минимальной суммы для спора
  if (order.amount < 100) { // Минимальная сумма в USDT
    throw new ValidationError('Сумма заказа слишком мала для создания спора');
  }
};

module.exports = {
  createDisputeValidator,
  resolveDisputeValidator,
  validateBusinessRules
};
