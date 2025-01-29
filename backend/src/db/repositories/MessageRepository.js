
const BaseRepository = require('./BaseRepository');
const Message = require('../models/Message');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  async findByDeal(dealId) {
    return this.find({ deal: dealId }).populate('sender', 'username');
  }

  async getUnmoderatedMessages() {
    return this.find({ isModerated: false }).populate('deal sender');
  }
}

module.exports = new MessageRepository();
