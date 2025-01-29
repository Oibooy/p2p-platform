
const BaseRepository = require('./BaseRepository');
const Deal = require('../models/Deal');

class DealRepository extends BaseRepository {
  constructor() {
    super(Deal);
  }

  async findByIdWithDetails(id) {
    return this.model.findById(id)
      .populate('buyer', 'username')
      .populate('seller', 'username');
  }

  async findUserDeals(userId) {
    return this.find({
      $or: [{ buyer: userId }, { seller: userId }]
    }).populate('buyer seller', 'username');
  }

  async findActiveDeals() {
    return this.find({
      status: { $in: ['pending', 'active'] },
      deadline: { $gt: new Date() }
    }).populate('buyer seller', 'username');
  }

  async updateDealStatus(id, status) {
    const deal = await this.findById(id);
    if (!deal) return null;
    
    await deal.addStatusToHistory(status);
    return deal;
  }

  async findDisputedDeals() {
    return this.find({
      status: 'disputed'
    }).populate('buyer seller', 'username');
  }
}

module.exports = new DealRepository();
