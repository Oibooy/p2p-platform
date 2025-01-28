
const Deal = require('../models/Deal');

class DealRepository {
  async findById(id) {
    return Deal.findById(id).populate('order');
  }

  async create(dealData) {
    return Deal.create(dealData);
  }

  async updateStatus(id, status) {
    return Deal.findByIdAndUpdate(id, { status }, { new: true });
  }
}

module.exports = new DealRepository();
