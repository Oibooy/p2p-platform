
const BaseRepository = require('./BaseRepository');
const Dispute = require('../models/Dispute');
const redisClient = require('../../infrastructure/redisClient');

class DisputeRepository extends BaseRepository {
  constructor() {
    super(Dispute);
  }

  async findPendingDisputes() {
    const cacheKey = 'pending_disputes';
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const disputes = await this.model
      .find({ status: 'pending' })
      .populate('order')
      .populate('initiator', 'username')
      .populate('moderator', 'username')
      .lean();

    await redisClient.setex(cacheKey, 300, JSON.stringify(disputes));
    return disputes;
  }

  async countUserDisputes(userId, hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.model.countDocuments({
      initiator: userId,
      createdAt: { $gte: since }
    });
  }

  async findByIdWithTransaction(id, session) {
    return this.model
      .findById(id)
      .populate('order')
      .populate('initiator')
      .session(session);
  }
}

module.exports = new DisputeRepository();
