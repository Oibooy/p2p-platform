
const BaseRepository = require('./BaseRepository');
const Message = require('../models/Message');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  async findByDeal(dealId) {
    return this.find({ deal: dealId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
  }

  async getUnmoderatedMessages() {
    return this.find({ isModerated: false })
      .populate('deal sender');
  }

  async markAsModerated(messageId) {
    return this.update(messageId, { isModerated: true });
  }

  async getLatestMessages(dealId, limit = 20) {
    return this.model.find({ deal: dealId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new MessageRepository();
