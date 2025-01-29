
const BaseRepository = require('./BaseRepository');
const Dispute = require('../models/Dispute');

class DisputeRepository extends BaseRepository {
  constructor() {
    super(Dispute);
  }

  async findPendingDisputes() {
    return this.find({ status: 'pending' })
      .populate('order')
      .populate('initiator', 'username')
      .populate('moderator', 'username');
  }

  async findByModerator(moderatorId) {
    return this.find({ moderator: moderatorId })
      .populate('order')
      .populate('initiator', 'username');
  }

  async assignModerator(disputeId, moderatorId) {
    return this.update(disputeId, {
      moderator: moderatorId,
      status: 'in_progress'
    });
  }
}

module.exports = new DisputeRepository();
