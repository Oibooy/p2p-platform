
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const Order = require('../models/Order');
const Deal = require('../models/Deal');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Dispute = require('../models/Dispute');
const DealHistory = require('../models/DealHistory');

async function up() {
  // Создание индексов для всех коллекций
  await User.createIndexes();
  await Order.createIndexes();
  await Deal.createIndexes();
  await Message.createIndexes();
  await Review.createIndexes();
  await Notification.createIndexes();
  await Dispute.createIndexes();
  await DealHistory.createIndexes();
  
  // Создание составных индексов
  // Индексы для Order
  await Order.collection.createIndex({ user: 1, status: 1 });
  await Order.collection.createIndex({ type: 1, status: 1 });
  await Order.collection.createIndex({ expiresAt: 1 });
  await Order.collection.createIndex({ price: 1 });
  await Order.collection.createIndex({ amount: 1 });
  
  // Индексы для Deal и DealHistory
  await Deal.collection.createIndex({ buyer: 1, seller: 1 });
  await Deal.collection.createIndex({ status: 1 });
  await DealHistory.collection.createIndex({ dealId: 1, createdAt: -1 });
  
  // Индексы для сообщений и уведомлений
  await Message.collection.createIndex({ sender: 1, recipient: 1, createdAt: -1 });
  await Notification.collection.createIndex({ user: 1, read: 1, createdAt: -1 });
  
  // Индексы для Review
  await Review.collection.createIndex({ dealId: 1 });
  await Review.collection.createIndex({ from: 1, to: 1 });
  await Review.collection.createIndex({ rating: -1 });
  
  // Создание базовых ролей
  const roles = ['user', 'moderator', 'admin'];
  for (const roleName of roles) {
    await Role.findOneAndUpdate(
      { name: roleName },
      { 
        name: roleName,
        permissions: getRolePermissions(roleName)
      },
      { upsert: true }
    );
  }

  // Создание базовых настроек уведомлений
  const defaultNotificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
    dealUpdates: true,
    messageNotifications: true,
    marketingEmails: false
  };

  await User.updateMany(
    { notificationSettings: { $exists: false } },
    { $set: { notificationSettings: defaultNotificationSettings } }
  );
}

function getRolePermissions(role) {
  switch (role) {
    case 'admin':
      return ['manage_users', 'manage_orders', 'manage_deals', 'resolve_disputes'];
    case 'moderator':
      return ['view_orders', 'manage_deals', 'resolve_disputes'];
    case 'user':
      return ['create_orders', 'create_deals'];
    default:
      return [];
  }
}

async function down() {
  // Удаление индексов всех коллекций
  await User.collection.dropIndexes();
  await Order.collection.dropIndexes();
  await Deal.collection.dropIndexes();
  await Message.collection.dropIndexes();
  await Review.collection.dropIndexes();
  await Notification.collection.dropIndexes();
  await Dispute.collection.dropIndexes();
  await DealHistory.collection.dropIndexes();
  
  // Удаление ролей
  await Role.deleteMany({});
  
  // Удаление настроек уведомлений
  await User.updateMany({}, { $unset: { notificationSettings: "" } });
}

module.exports = { up, down };
