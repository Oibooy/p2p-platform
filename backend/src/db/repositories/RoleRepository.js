
const BaseRepository = require('./BaseRepository');
const Role = require('../models/Role');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findByName(name) {
    return this.findOne({ name });
  }

  async findRolesByNames(names) {
    return this.find({ name: { $in: names } });
  }
}

module.exports = RoleRepository;
