# Backend Documentation for P2P Platform
P2P Token Trading Backend

Описание
Это серверная часть P2P платформы для покупки и продажи MTT токенов за USDT. Основные функции включают управление пользователями, сделки через эскроу, систему уведомлений, арбитраж и поддержку модераторов/администраторов.

Особенности проекта
Регистрация и авторизация:

Регистрация пользователей с подтверждением email.
Авторизация с использованием JWT.
Поддержка ролей: пользователь, модератор, администратор.
Эскроу-система:

Депонирование средств.
Разблокировка средств продавцу.
Возврат средств покупателю.
Таймер для автоматического возврата.
Арбитраж:

Решение споров модераторами.
Запись решений в базе данных.
Уведомления:

Уведомления о событиях в системе.
Поддержка WebSocket для уведомлений в реальном времени.
Рейтинг и отзывы:

Отзывы после завершения сделок.
Расчет рейтинга участников.
Поддержка мультиязычности:

Интерфейс и уведомления на нескольких языках.

Технологии
Язык: Node.js
Фреймворк: Express.js
База данных: MongoDB (с использованием Mongoose)
Взаимодействие с блокчейном: TronWeb
Безопасность:
JWT для аутентификации.
Шифрование паролей с помощью bcrypt.
Валидация данных с помощью express-validator.

Установка
1. Клонирование репозитория:
git clone https://github.com/your-repo/p2p-platform-backend.git
cd p2p-platform-backend

2. Установка зависимостей:
npm install

3. Создание файла окружения .env: Пример содержимого:

PORT=5000
MONGO_URI=mongodb://localhost:27017/p2p-platform
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
ESCROW_CONTRACT_ADDRESS=your_tron_smart_contract_address

4. Запуск приложения:

В режиме разработки:
npm run dev

В режиме производства:
npm start



API Эндпоинты
1. Аутентификация
POST /api/auth/register - Регистрация пользователя.
POST /api/auth/login - Авторизация пользователя.
POST /api/auth/resend-confirmation - Повторная отправка email подтверждения.
GET /api/auth/confirm-email/:token - Подтверждение email.
2. Пользователи
GET /api/users/me - Получение профиля текущего пользователя.
PATCH /api/users/:id - Обновление информации о пользователе (только для администратора).
3. Сделки
POST /api/escrow/deposit - Депонирование средств.
POST /api/escrow/release - Разблокировка средств.
POST /api/escrow/refund - Возврат средств.
4. Уведомления
GET /api/notifications - Получение всех уведомлений.
PATCH /api/notifications/:id - Отметить уведомление как прочитанное.
DELETE /api/notifications - Удалить все уведомления пользователя.
5. Арбитраж
POST /api/disputes - Создание спора.
PATCH /api/disputes/:id/resolve - Решение спора модератором.
6. Отзывы
POST /api/reviews - Добавление отзыва.
GET /api/reviews/:userId - Получение отзывов о пользователе.


Структура проекта

p2p-platform-backend/
├── src/
│   ├── models/           # Схемы Mongoose
│   │   ├── User.js
│   │   ├── Deal.js
│   │   ├── Notification.js
│   │   └── Review.js
│   ├── routes/           # Эндпоинты API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── escrow.js
│   │   ├── notifications.js
│   │   └── disputes.js
│   ├── middleware/       # Промежуточные обработчики
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── services/         # Логика взаимодействия с блокчейном
│   │   └── escrowService.js
│   ├── utils/            # Вспомогательные функции
│   │   ├── emailSender.js
│   │   ├── eventHandlers.js
│   │   └── webSocket.js
│   ├── app.js            # Основной файл приложения
│   └── server.js         # Точка входа
├── .env                  # Переменные окружения
├── package.json          # Зависимости
└── README.md             # Документация


Тестирование
API Тестирование: Используйте Postman или Insomnia для проверки эндпоинтов.

Юнит-тесты: Установите jest и создайте тесты:
npm install --save-dev jest supertest

Деплой
Подготовка:
Убедитесь, что переменные окружения правильно настроены.
Используйте такие платформы, как AWS, Heroku или DigitalOcean.
Команды деплоя:
Сборка проекта:
npm run build
Запуск в продакшн
npm start

Контакты
Если у вас возникли вопросы или проблемы, свяжитесь с разработчиком:
Email:kerimkulonesoul@gmail.com
Telegram: @oibooy