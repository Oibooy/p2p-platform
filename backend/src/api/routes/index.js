const express = require('express');

const authRoutes = require('./auth');
const orderRoutes = require('./orders');
const reviewRoutes = require('./reviews');
const adminRoutes = require('./admin');
const disputesRoutes = require('./disputes');
const messagesRoutes = require('./messages');
const notificationsRoutes = require('./notifications');

const router = express.Router();

// Подключаем маршруты
router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/disputes', disputesRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);

module.exports = router;