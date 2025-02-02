// db/migrations/addIndexes.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

async function addIndexes() {
  try {
    console.log('Adding indexes to MongoDB collections...');
    
    await User.collection.createIndex({ telegramId: 1 }, { unique: true });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ userId: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ userId: 1, createdAt: -1 });
    
    console.log('Indexes added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding indexes:', error);
    process.exit(1);
  }
}

addIndexes();
