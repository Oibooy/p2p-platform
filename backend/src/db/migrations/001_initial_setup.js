const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

async function up() {
  // Создание индексов для основных коллекций
  await User.createIndexes();
  await mongoose.model('Order').createIndexes();
  await mongoose.model('Deal').createIndexes();
  
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
  // Удаление индексов
  await User.collection.dropIndexes();
  await mongoose.model('Order').collection.dropIndexes();
  await mongoose.model('Deal').collection.dropIndexes();
  
  // Удаление ролей
  await Role.deleteMany({});
}

module.exports = { up, down };