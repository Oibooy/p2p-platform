// src/api/routes.js
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const moderatorController = require('../controllers/moderatorController');

const router = express.Router();

// 🔹 Аутентификация
router.post('/auth/telegram', authController.telegramAuth);

// 🔹 Пользовательские маршруты (USER)
router.get('/user/profile', authenticate, userController.getProfile);
router.post('/user/deposit', authenticate, userController.depositFunds);
router.post('/user/withdraw', authenticate, userController.withdrawFunds);

// 🔹 Модерация (MODERATOR)
router.get('/moderator/disputes', authenticate, authorizeRole(['MODERATOR', 'ADMIN']), moderatorController.getDisputes);
router.post('/moderator/resolve', authenticate, authorizeRole(['MODERATOR', 'ADMIN']), moderatorController.resolveDispute);

// 🔹 Админ-панель (ADMIN)
router.get('/admin/users', authenticate, authorizeRole(['ADMIN']), adminController.getAllUsers);
router.patch('/admin/users/:id', authenticate, authorizeRole(['ADMIN']), adminController.updateUserRole);
router.delete('/admin/users/:id', authenticate, authorizeRole(['ADMIN']), adminController.deleteUser);

module.exports = router;
