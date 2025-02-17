const BaseRepository = require('./BaseRepository');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../services/loggingService');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }

  async findByIdWithBalance(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    return this.findOne({ _id: userId }).select('balance');
  }

  async updateRole(userId, roleId) {
    return this.update(userId, { role: roleId });
  }

  async getActiveUsers() {
    return this.find({ isActive: true });
  }

  async updateUserBalance(userId, token, amount) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.balance[token]) {
        throw new Error(`Token ${token} not supported`);
      }
      user.balance[token] = (user.balance[token] || 0) + amount;
      if (user.balance[token] < 0) {
        throw new Error('Insufficient funds');
      }
      await user.save({ session });
      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`Failed to update user balance: ${error.message}`);
      throw error;
    }
  }
}

// Добавляем индекс для ускорения поиска
User.collection.createIndex({ email: 1, isActive: 1 });

module.exports = new UserRepository();
