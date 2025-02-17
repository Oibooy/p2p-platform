const mongoose = require('mongoose');
const logger = require('../services/loggingService');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    return this.model.findById(id);
  }

  async findOne(filter) {
    return this.model.findOne(filter);
  }

  async find(filter = {}) {
    return this.model.find(filter);
  }

  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      logger.error(`Error creating document: ${error.message}`);
      throw error;
    }
  }

  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    try {
      return await this.model.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      logger.error(`Error updating document: ${error.message}`);
      throw error;
    }
  }

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    return this.model.findByIdAndDelete(id);
  }

  async findWithPagination(filter = {}, page = 1, limit = 10, sortField = 'createdAt', sortOrder = -1) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
      this.model.countDocuments(filter)
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async updateMany(filter, update) {
    return this.model.updateMany(filter, update);
  }

  async deleteMany(filter) {
    return this.model.deleteMany(filter);
  }

  async withTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`Transaction failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BaseRepository;
