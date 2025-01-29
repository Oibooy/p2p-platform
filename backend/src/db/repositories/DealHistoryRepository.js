
const BaseRepository = require('./BaseRepository');
const DealHistory = require('../models/DealHistory');

class DealHistoryRepository extends BaseRepository {
  constructor() {
    super(DealHistory);
  }

  async findByDeal(dealId) {
    return this.find({ dealId })
      .populate('performer', 'username')
      .sort({ timestamp: -1 });
  }

  async addEntry(dealId, action, performerId, details = {}) {
    return this.create({
      dealId,
      action,
      performer: performerId,
      details,
      eventType: action
    });
  }

  async getDealTimeline(dealId) {
    return this.find({ dealId })
      .populate('performer', 'username')
      .sort({ timestamp: 1 });
  }
}

module.exports = new DealHistoryRepository();
