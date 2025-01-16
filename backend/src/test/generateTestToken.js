require('dotenv').config(); // Подгрузить переменные окружения из .env
const jwt = require('jsonwebtoken');

// Данные тестового пользователя
const testUser = {
  id: '6784d2238de358b0f2e7149a', // Уникальный ID пользователя
  address: 'TJqLzXmKes3wwD4Mm3SrRMQ6KPALzWGzBA', // Пример Tron-адреса
};

// Генерация токена
const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log('Generated Test Token:', token);